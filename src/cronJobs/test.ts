import cron from 'node-cron'

export const test = () => {
    cron.schedule("* * * * *", async () => {
        console.log("Running every minute");
    });
}