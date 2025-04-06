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
const schema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
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

const UserModel = mongoose.model("User", schema);

const generateFormObjectFromTraversalMongooseSchema = (schema) => {
	return Object.keys(schema.paths).reduce((acc, key) => {
		const path = schema.paths[key];
		if (path.schema) {
			acc[key] = {
				instance: path.instance,
				schema: generateFormObjectFromTraversalMongooseSchema(path.schema),
			};
		} else {
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

app.get("/api/schema/user", async (req, res) => {
	res.json(generateFormObjectFromTraversalMongooseSchema(UserModel.schema));
});

app.post("/api/user", async (req, res) => {
	const user = new UserModel(req.body);
	await user.save();
	res.json(user);
});
app.get("/api/user", async (req, res) => {
	const users = await UserModel.find();
	res.json(users);
});
app.put("/api/user/:id", async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(user);
});
app.get("/api/user/:id", async (req, res) => {
	const user = await UserModel.findById(req.params.id);
	res.json(user);
});
