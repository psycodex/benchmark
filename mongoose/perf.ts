import {performance} from 'perf_hooks';
import {User} from "./user";
import {connect} from "mongoose";

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
    await connect('mongodb://localhost:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    const rounds = 10;

    for (let j = 0; j <= rounds; j++) {
        process.stdout.write(`\rround ${j}/${rounds}`);
        total[j] = {all: 0, find: 0, insert: 0, update: 0, remove: 0};

        await bench(j, 'insert', async () => {
            await User.deleteMany({});
            // let user = await orm.getRepository(User).delete({});
            for (let i = 1; i <= count; i++) {
                const user = new User();
                user.name = 'Peter ' + i;
                user.id2 = i;
                user.ready = true;
                user.priority = 5;
                await user.save();
            }
        });

        await bench(j, 'find', async () => {
            const users = await User.find({});
        });

        const items = await User.find({});
        await bench(j, 'update', async () => {
            for (const i of items) {
                i.priority++;
                await i.save();
            }
        });

        await bench(j, 'remove', async () => {
            for (const i1 of items) {
                await i1.deleteOne();
            }
        });
    }

    // process.stdout.write(`\r`);
    // console.table(total);

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

    console.table({min, avg, max});
})();
