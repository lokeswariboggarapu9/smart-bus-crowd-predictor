const http = require("http");
const url = require("url");
const fs = require("fs");

const csvData = fs.readFileSync("../bus_data.csv", "utf8");

const rows = csvData.trim().split("\n");

const data = rows.slice(1).map(row => {
    const columns = row.split(",");

    return {
        bus: columns[0]?.trim(),
        time: columns[1]?.trim(),
        passengers: Number(columns[2]),
        capacity: Number(columns[3])
    };
});

const server = http.createServer((req, res) => {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    const parsedUrl = url.parse(req.url, true);
    const query = parsedUrl.query;

    if (parsedUrl.pathname === "/api/predict") {

        const bus = query.bus;
        const route = query.route;
        const time = query.time;

        const result = data.find(row =>
            row.bus === bus &&
            row.time === time
        );

        if (!result) {
            res.end(JSON.stringify({
                passengers: 0,
                capacity: 80,
                crowd: "LOW",
                percentage: 0,
                message: "No data found for selected bus and time.",
                recommendation: "Please select another option."
            }));
            return;
        }

        const passengers = result.passengers;
        const capacity = result.capacity;

        const percentage = Math.round(
            (passengers / capacity) * 100
        );

        let crowd;

        if (percentage >= 80) {
            crowd = "HIGH";
        } else if (percentage >= 40) {
            crowd = "MEDIUM";
        } else {
            crowd = "LOW";
        }

        res.end(JSON.stringify({
            bus: bus,
            route: route,
            passengers: passengers,
            capacity: capacity,
            crowd: crowd,
            percentage: percentage,
            message: crowd + " crowd expected.",
            recommendation:
                crowd === "HIGH"
                    ? "Travel during less busy hours."
                    : "Current time is suitable for travel."
        }));

    } else {

        res.end(JSON.stringify({
            message: "Smart Bus Crowd Predictor Backend is running"
        }));
    }
});

server.listen(5000, () => {
    console.log("Backend running at http://localhost:5000");
});