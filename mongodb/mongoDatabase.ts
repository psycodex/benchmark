import {Db, MongoClient} from "mongodb";

const url = `mongodb://localhost:27017/mongodb-test`;

export const connectDatabase = (): Promise<MongoClient> => {
    const client = MongoClient.connect(url);
    return client;
};

export class MongoDatabase {
    private client: MongoClient | undefined;

    public async connectDatabase() {
        this.client = await MongoClient.connect(url);
    }

    public closeConnection() {
        this.client?.close();
    }

    public getDb(dbName: string): Db | undefined {
        return this.client?.db(dbName);
    }
}
