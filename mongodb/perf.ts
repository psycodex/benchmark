import {performance} from 'perf_hooks';
import {MongoDatabase} from "./mongoDatabase";

const total: { all: number; find: number; insert: number; update: number; remove: number }[] = [];

export async function bench(round: number, title: string, exec: () => void | Promise<void>) {
    const start = performance.now();
    await exec();
    const took = performance.now() - start;
    total[round].all += took;
    total[round][title] = took;

    // global.gc();
    // process.stdout.write([
    //   (1000 / took), 'ops/s',
    //   title,
    //   (took.toLocaleString(undefined, { maximumFractionDigits: 17 }), 'ms,',
    //   process.memoryUsage().rss / 1024 / 1024, 'MB memory',
    // ].join(' ') + '\n');
}


(async () => {
    const count = 10_000;
    const conn = new MongoDatabase();
    await conn.connectDatabase();

    const db = conn.getDb('mongodb-user');
    const rounds = 10;

    for (let j = 0; j <= rounds; j++) {
        process.stdout.write(`\rround ${j}/${rounds}`);
        total[j] = {all: 0, find: 0, insert: 0, update: 0, remove: 0};

        const user = db?.collection('user');
        await bench(j, 'insert', async () => {
            user?.deleteMany({});
            for (let i = 1; i <= count; i++) {
                await user?.insertOne({
                    'name': 'Peter ' + i,
                    'id2': i,
                    'ready': true,
                    'priority': 5
                });
                await user?.insertMany([{},{}]);
            }
        });

        await bench(j, 'find', async () => {
            const users = await user?.find({});
        });

        const users = await user?.find({})?.toArray();
        await bench(j, 'update', async () => {
            if (users != undefined) {
                for (const i of users) {
                    i.priority++;
                    user?.updateOne({_id: i._id}, {$set: {priority: i.priority}});
                }
            }
        });

        await bench(j, 'remove', async () => {
            if (users != undefined) {
                for (const i1 of users) {
                    await user?.deleteOne({_id: i1._id});
                }
            }
        });
    }

    delete total[0]; // ignore first round (warm up)
    const min = {
        all: Number.MAX_VALUE,
        find: Number.MAX_VALUE,
        insert: Number.MAX_VALUE,
        update: Number.MAX_VALUE,
        remove: Number.MAX_VALUE
    };
    const max = {all: 0, find: 0, insert: 0, update: 0, remove: 0};
    const avg = {all: 0, find: 0, insert: 0, update: 0, remove: 0};
    total.forEach(row => {
        min.all = Math.min(min.all, row.all);
        min.insert = Math.min(min.insert, row.insert);
        min.find = Math.min(min.find, row.find);
        min.update = Math.min(min.update, row.update);
        min.remove = Math.min(min.remove, row.remove);

        max.all = Math.max(max.all, row.all);
        max.insert = Math.max(max.insert, row.insert);
        max.find = Math.max(max.find, row.find);
        max.update = Math.max(max.update, row.update);
        max.remove = Math.max(max.remove, row.remove);

        avg.all += row.all;
        avg.insert += row.insert;
        avg.find += row.find;
        avg.update += row.update;
        avg.remove += row.remove;
    });

    avg.all /= rounds;
    avg.insert /= rounds;
    avg.find /= rounds;
    avg.update /= rounds;
    avg.remove /= rounds;
    console.log('\n')
    console.table({min, avg, max});
    conn.closeConnection();
})();
