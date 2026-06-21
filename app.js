const express = require("express");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root@123",
    database: "studentdb"
});

// Connect Database
db.connect((err) => {
    if (err) {
        console.log("Database Connection Failed");
        console.log(err);
    } else {
        console.log("MySQL Connected");
    }
});

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