import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const airports = ['ATL', 'PEK', 'DXB', 'TYO', 'LON', 'LAX', 'PAR', 'FRA', 'IST', 'SIN', 'MAD', 'AMS', 'DFW', 'CAN', 'SAO'];

const economyRaw = [
[0, null, null, 1400, null, 400, null, 800, null, 1500, 800, null, 200, null, 900],
[null, 0, 700, 500, 900, null, 950, null, null, 600, 950, 900, 1150, 200, 1700],
[null, 700, 0, 750, 650, 1300, 700, 600, 400, 600, null, 650, 1200, 650, 1400],
[1400, 500, 750, 0, 1000, 900, 1050, null, 900, 700, 1100, null, 1350, 550, null],
[700, null, 650, 1000, 0, 800, 150, 200, 400, 900, 200, 150, 750, 950, 1100],
[400, 1100, 1300, 900, null, 0, 850, 900, 1100, 1400, null, 850, 300, 1150, null],
[750, null, 700, 1050, null, 850, 0, 150, 450, 950, 200, 180, null, 950, 1050],
[null, 850, 600, 950, 200, 900, 150, 0, 350, 900, null, null, 850, 900, null],
[null, 800, 400, 900, null, 1100, null, 350, 0, 800, 500, 450, 1000, 800, 1200],
[null, 600, null, 700, 900, null, 950, null, 800, 0, 1000, null, 1400, null, null],
[null, null, 750, null, null, 900, 200, 250, 500, 1000, 0, 200, 850, 950, 1000],
[780, 900, 650, 1000, 150, 850, null, 200, 450, 950, 200, 0, 800, 900, 1050],
[200, null, 1200, null, null, 300, 800, null, 1000, null, 850, 800, 0, 1200, 950],
[1250, 200, 650, 550, 950, 1150, 950, null, 800, 500, null, 900, 1200, 0, 1700],
[900, 1700, 1400, 1800, 1100, 1000, 1050, 1100, 1200, 1800, 1000, 1050, 950, 1700, 0]
];

const firstClassRaw = [
[0, null, null, 1890, null, 540, null, 1080, null, 2025, 1080, null, 270, null, 1215],
[null, 0, 945, 675, 1215, null, 1283, null, null, 810, 1283, 1215, 1553, 270, 2295],
[null, 945, 0, 1013, 878, 1755, 945, 810, 540, 810, null, 878, 1620, 878, 1890],
[1890, 675, 1013, 0, 1350, 1215, 1418, null, 1215, 945, 1485, null, 1823, 743, null],
[945, null, 878, 1350, 0, 1080, 203, 270, 540, null, 270, 203, null, 1283, 1485],
[540, 1485, 1755, 1215, null, 0, 1148, 1215, 1485, 1890, null, 1148, 405, 1553, null],
[1013, null, 945, 1418, null, 1148, 0, 203, 608, 1283, 270, 243, null, 1283, 1418],
[null, 1148, 810, 1283, 270, 1215, 203, 0, 473, 1215, null, null, 1148, 1215, null],
[null, 1080, 540, 1215, null, 1485, null, 473, 0, 1080, 675, 608, 1350, 1080, 1620],
[null, 810, null, 945, 1215, null, 1283, null, 1080, 0, 1350, null, 1890, null, null],
[null, null, 1013, null, null, 1215, 270, 338, 675, 1350, 0, 270, 1148, 1283, 1350],
[1053, 1215, 878, 1350, 203, 1148, null, 270, 608, 1283, 270, 0, 1080, 1215, 1418],
[270, null, 1620, null, null, 405, 1080, null, 1350, null, 1148, 1080, 0, 1620, 1283],
[1688, 270, 878, 743, 1283, 1553, 1283, null, 1080, 675, null, 1215, 1620, 0, 2295],
[1215, 2295, null, 2430, 1485, null, 1418, 1485, 1620, null, 1350, null, 1283, 2295, 0]
];

const flightTimesRaw = [
[0, 15, 14, 16, 8, 5, 9, 9, 11, 18, 8, 9, 2, 16, 9],
[15, 0, 8, 3, 10, 12, 11, 10, 9, 6, 12, 10, 14, 3, 22],
[14, 8, 0, 10, 7, 16, 7, 7, 4, 7, 8, 7, 15, 8, 15],
[16, 3, 10, 0, 12, 11, 13, 12, 11, 7, 14, 12, 13, 4, 24],
[8, 10, 7, 12, 0, 11, 1, 1, 4, 13, 2, 1, 10, 11, 12],
[5, 12, 16, 11, 11, 0, 11, 11, 13, 17, 11, 11, 3, 14, 12],
[9, 11, 7, 13, 1, 11, 0, 1, 3, 13, 2, 1, 10, 11, 12],
[9, 10, 7, 12, 1, 11, 1, 0, 3, 12, 2, 1, 10, 10, 12],
[11, 9, 4, 11, 4, 13, 3, 3, 0, 10, 4, 3, 12, 9, 13],
[18, 6, 7, 7, 13, 17, 13, 12, 10, 0, 14, 13, 17, 4, 25],
[8, 12, 8, 14, 2, 11, 2, 2, 4, 14, 0, 2, 10, 12, 10],
[9, 10, 7, 12, 1, 11, 1, 1, 3, 13, 2, 0, 10, 10, 12],
[2, 14, 15, 13, 10, 3, 10, 10, 12, 17, 10, 10, 0, 15, 10],
[16, 3, 8, 4, 11, 14, 11, 10, 9, 4, 12, 10, 15, 0, 23],
[9, 22, 15, 24, 12, 12, 12, 12, 13, 25, 10, 12, 10, 23, 0]
];

function createMatrix(rawArray) {
    const obj = {};
    for (let i = 0; i < airports.length; i++) {
        const origin = airports[i];
        obj[origin] = {};
        for (let j = 0; j < airports.length; j++) {
            const dest = airports[j];
            obj[origin][dest] = rawArray[i][j];
        }
    }
    return obj;
}

const dir = path.join(__dirname, '../src/data/matrices');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(path.join(dir, 'economy_prices.json'), JSON.stringify(createMatrix(economyRaw), null, 2));
fs.writeFileSync(path.join(dir, 'first_class_prices.json'), JSON.stringify(createMatrix(firstClassRaw), null, 2));
fs.writeFileSync(path.join(dir, 'flight_times.json'), JSON.stringify(createMatrix(flightTimesRaw), null, 2));

console.log('JSON matrices generated successfully at', dir);
