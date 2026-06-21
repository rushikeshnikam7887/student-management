const express = require("express");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ======================
// DATABASE CONNECTION
// ======================

const db = mysql.createPool({
    host: "student-mysql",
    user: "root",
    password: "root123",
    database: "studentdb",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
function testConnection() {
    db.getConnection((err, connection) => {

        if (err) {
            console.log("Database not ready, retrying in 5 seconds...");
            console.log(err.message);

            setTimeout(testConnection, 5000);
            return;
        }

        console.log("MySQL Connected Successfully");
        connection.release();
    });
}

testConnection();
// ======================
// REGISTER ROUTE
// ======================

app.post("/register", (req, res) => {

    const { name, email, userid, password } = req.body;

    const sql =
        "INSERT INTO users(name,email,userid,password) VALUES(?,?,?,?)";

    db.query(
        sql,
        [name, email, userid, password],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.json({
                    success: false,
                    message: "Registration Failed"
                });
            }

            res.json({
                success: true,
                message: "Registration Successful"
            });

        }
    );

});

// ======================
// LOGIN ROUTE
// ======================

app.post("/login", (req, res) => {

    const { userid, password } = req.body;

    const sql =
        "SELECT * FROM users WHERE userid=? AND password=?";

    db.query(
        sql,
        [userid, password],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length > 0) {

                res.json({
                    success: true,
                    message: "Login Successful"
                });

            } else {

                res.json({
                    success: false,
                    message: "Invalid User ID or Password"
                });

            }

        }
    );

});

// ======================
// SERVER
// ======================

app.listen(3000, () => {
    console.log("Server Running on Port 3000");
});
