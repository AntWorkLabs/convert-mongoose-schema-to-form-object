import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import expresss from "express";
import cors from "cors";

const workSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	company: {
		type: String,
		required: true,
	},
});

const itemSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
});

/**
 * @type {mongoose.Schema}
 */
const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
    description: "Name of the user",
	},
  onBoarding: {
    type: Boolean,
    default: false,
  },
	season: {
		type: Number,
		required: true,
	},
	age: {
		type: Number,
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	work: {
		type: workSchema,
	},
	items: {
		type: [itemSchema],
	},
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,

  },
  price: {
    type: Number,
    required: true,
  },
});

const InventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  }],
}, {timestamps: true});

const ignoredkeys = ["createdAt", "updatedAt", "__v"];

const generateFormObjectFromTraversalMongooseSchema = (schema) => {
	return Object.keys(schema.paths).reduce((acc, key) => {
		const path = schema.paths[key];
		if (path.schema) {
			acc[key] = {
				instance: path.instance,
				schema: generateFormObjectFromTraversalMongooseSchema(path.schema),
			};
		} else {
      if (ignoredkeys.includes(key)) {
				return acc;
			}
			acc[key] = {
				instance: path.instance,
				options: {
					...path.options,
					enum: path.enumValues,
				},
			};
		}
		return acc;
	}, {});
};

async function main() {
	const mongo = await MongoMemoryServer.create();
	const uri = mongo.getUri();
	await mongoose.connect(uri);
}

const app = expresss();
app.use(expresss.json());
app.use(cors());

app.listen(3000, () => {
	main();
});

const schemaMap = new Map([
  ["user", UserSchema],
  ["product", ProductSchema],
  ["inventory", InventorySchema],
]);

app.get("/api/schema", async (req, res) => {
  const schemas = Array.from(schemaMap.keys()).map((key) => ({
    name: key,
  }));
  res.json(schemas);
});

app.get("/api/schema/:schemaName", async (req, res) => {
	const schemaName = req.params.schemaName;
  if (!schemaMap.has(schemaName)) {
    return res.status(404).json({ error: "Schema not found" });
  }
  const schema = schemaMap.get(schemaName);
  const formObject = generateFormObjectFromTraversalMongooseSchema(schema);
  res.json(formObject);
});

app.post("/api/:schemaName", async (req, res) => {
  const schemaName = req.params.schemaName;
  if (!schemaMap.has(schemaName)) {
    return res.status(404).json({ error: "Schema not found" });
  }
  const Model = mongoose.model(schemaName, schemaMap.get(schemaName));
  const document = new Model(req.body);
  await document.save();
  res.json(document);
});
app.get("/api/:schemaName", async (req, res) => {
  const schemaName = req.params.schemaName;
  if (!schemaMap.has(schemaName)) {
    return res.status(404).json({ error: "Schema not found" });
  }
  const Model = mongoose.model(schemaName, schemaMap.get(schemaName));
  const documents = await Model.find();
  res.json(documents);
});
app.get("/api/:schemaName/:id", async (req, res) => {
  const schemaName = req.params.schemaName;
  if (!schemaMap.has(schemaName)) {
    return res.status(404).json({ error: "Schema not found" });
  }
  const Model = mongoose.model(schemaName, schemaMap.get(schemaName));
  const document = await Model.findById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json(document);
})
app.put("/api/:schemaName/:id", async (req, res) => {
  const schemaName = req.params.schemaName;
  if (!schemaMap.has(schemaName)) {
    return res.status(404).json({ error: "Schema not found" });
  }
  const Model = mongoose.model(schemaName, schemaMap.get(schemaName));
  const document = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json(document);
})

app.delete("/api/:schemaName/:id", async (req, res) => {
  const schemaName = req.params.schemaName;
  if (!schemaMap.has(schemaName)) {
    return res.status(404).json({ error: "Schema not found" });
  }
  const Model = mongoose.model(schemaName, schemaMap.get(schemaName));
  console.log(req.params.id);
  const document = await Model.findByIdAndDelete(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json(document);
})


