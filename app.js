app.get("/products", (req, res) => {
    const sql = "SELECT * FROM products"; // Replace 'products' with your table name
    db.query(sql, (err, results) => {
      if (err) {
        return res.status(500).send("Database query error");
      }
      res.render("products", { products: results }); // Pass data to Pug template
    });
  });
  