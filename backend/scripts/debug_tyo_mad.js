import sql from 'mssql';
const config = { user: 'sa', password: 'SuperSecretSQL1!', server: '127.0.0.1', database: 'AerolineasDB', port: 1433, options: { trustServerCertificate: true } };
async function debug() {
    const pool = await sql.connect(config);

    // Rango real de fechas en la base
    const rango = await pool.request().query(`SELECT MIN(DepartureTime) as Minima, MAX(DepartureTime) as Maxima, COUNT(*) as Total FROM Flights`);
    console.log("\n=== RANGO DE FECHAS EN LA BASE ==="); console.table(rango.recordset);

    // TYO->MAD específico
    const tyomad = await pool.request().query(`SELECT CAST(DepartureTime AS DATE) as Fecha, COUNT(*) as Vuelos FROM Flights WHERE Origin='TYO' AND Destination='MAD' GROUP BY CAST(DepartureTime AS DATE) ORDER BY Fecha`);
    console.log("\n=== VUELOS TYO→MAD POR FECHA ==="); console.table(tyomad.recordset);

    // Posibles escalas TYO→?→MAD
    const escalas = await pool.request().query(`SELECT DISTINCT A.Origin, A.Destination as Escala, B.Destination FROM Flights A JOIN Flights B ON A.Destination=B.Origin WHERE A.Origin='TYO' AND B.Destination='MAD' AND A.Destination<>'MAD'`);
    console.log("\n=== ESCALAS POSIBLES TYO→?→MAD ==="); console.table(escalas.recordset);

    process.exit();
}
debug().catch(e => { console.error(e.message); process.exit(1); });
