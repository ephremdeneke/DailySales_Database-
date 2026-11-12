// Seed.gs (backend) - run seedProducts() once after initDatabase
const SEED_PRODUCTS = [
["Ambasha-pieces","አምባሻ ቁራጭ",2,200.00],
["Bans","ባንስ",22,80.00],
["Barley Bread","የገብስ ዳቦ",48,20.00],
["Biscuit","ቢስኩት",85,40.00],
["Bombolino","ቦምቦሊኖ",38,50.00],
["Bread 20","ዳቦ 20",293,20.00],
["Bread 80","ዳቦ 80",7,80.00],
["Brown Bread","ቡናማ ዳቦ",0,80.00],
["Coca","ኮካ",11,70.00],
["Cookies -20","ኩኪስ 20",158,20.00],
["Cookies -200","ኩኪስ 200",12,200.00],
["Cream Cake","ክሪም ኬክ",7,100.00],
["Cup Cake","ካፕ ኬክ",7,80.00],
["Cup Cake 50","ካፕ ኬክ 50",0,50.00],
["Dabo Kolo","ዳቦ ቆሎ",31,100.00],
["Dabo kolo -200","ዳቦ ቆሎ 200",0,200.00],
["Difo Bread","ድፎ ዳቦ",5,1000.00],
["Donat","ዶናት",17,70.00],
["Energy","ኢነርጂ",4,80.00],
["English Cake","እንግሊዝ ኬክ",13,80.00],
["Eskons","ኤስኮንስ",44,20.00],
["Flower","ፍላወር",19,80.00],
["Ginger","ዝንጅብል",40,30.00],
["Heath Bread","ሄልዝ ዳቦ",30,20.00],
["Injera","እንጀራ",537,30.00],
["KK","ኬኬ",27,30.00],
["Mafn","ማፍን",0,80.00],
["Mini Difo","ሚኒ ድፎ",10,80.00],
["Mirinda","ሚሪንዳ",9,120.00],
["Mitin","ሚቲን",0,80.00],
["Mulmul","ሙልሙል",26,40.00],
["Pepsi","ፔፕሲ",5,100.00],
["School Vanus","ስኩል ቫኑስ",40,80.00],
["Sinamon","ሲናሞን",0,80.00],
["Slice Cake","ስላይስ ኬክ",0,80.00],
["Special Torta","ስፔሻል ቶርታ",0,2000.00],
["Sprite","ስፕራይት",12,70.00],
["Teramiso","ተራሚሶ",3,100.00],
["Torta","ቶርታ",1,1200.00],
["Torta 1/2","ቶርታ 1/2",0,1000.00],
["VC Orange","ቪሲ ኦሬንጅ",13,70.00],
["Venus","ቬኑስ",10,80.00],
["Venus 1/2","ቬኑስ 1/2",15,50.00],
["Water 1/2L","ውሃ 1/2 ሊትር",8,30.00],
["Water 2L","ውሃ 2 ሊትር",18,70.00],
["White Bread","ነጭ ዳቦ",0,80.00],
["Yellow Bread","ቢጫ ዳቦ",0,80.00],
["Zebib","ዘቢብ",1,80.00],
["Zebra","ዘብራ",13,80.00]
];

function seedUsers() {
  const existing = sheetToObjects(SHEETS.USERS);
  if (existing.length > 0) return { inserted: 0, message: "Users already exist" };
  const rows = [
    ["u_admin","Admin User","admin@demo.com","ADMIN",""],
    ["u_wh","Warehouse Manager","warehouse@demo.com","WAREHOUSE_MANAGER",""],
    ["u_shop1","Gombora Shop Manager","gombora@demo.com","SHOP_MANAGER","shop_1"],
    ["u_shop2","Hospital Shop Manager","hospital@demo.com","SHOP_MANAGER","shop_2"],
  ];
  rows.forEach(function(r){
    appendObject(SHEETS.USERS, { userId: r[0], name: r[1], email: r[2], role: r[3], shopId: r[4], active: true, createdAt: new Date().toISOString() });
  });
  // shops
  const shops = sheetToObjects(SHEETS.SHOPS);
  if (shops.length === 0) {
    appendObject(SHEETS.SHOPS, { shopId: "shop_1", shopName: "Gombora Branch", location: "Gombora", managerId: "u_shop1", active: true, createdAt: new Date().toISOString() });
    appendObject(SHEETS.SHOPS, { shopId: "shop_2", shopName: "Hospital Branch", location: "Hospital", managerId: "", active: true, createdAt: new Date().toISOString() });
  }
  return { inserted: rows.length };
}

function seedProducts() {
  const existing = sheetToObjects(SHEETS.PRODUCTS);
  if (existing.length > 0) return { inserted: 0, message: "Products already exist" };
  let count = 0;
  SEED_PRODUCTS.forEach(function(row, idx) {
    const name = row[0], nameAm = row[1], qty = row[2], price = row[3];
    const pid = "p_" + (idx + 1);
    const sku = name.toUpperCase().replace(/[^A-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    appendObject(SHEETS.PRODUCTS, {
      productId: pid,
      productName: name,
      productNameAm: nameAm,
      sku: sku,
      sellingPrice: Math.round(price * 100),
      active: true,
      createdAt: new Date().toISOString(),
    });
    appendObject(SHEETS.WAREHOUSE_STOCK, { productId: pid, quantity: qty, updatedAt: new Date().toISOString() });
    count++;
  });
  return { inserted: count };
}
