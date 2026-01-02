import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URL!;
const client = new MongoClient(uri);

const clientPromise = client.connect();

if (!global._mongoClientPromise) {
  global._mongoClientPromise = clientPromise;
}

export const db = async () => {
  const client = await clientPromise;
  return client.db("tracker_app");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}