const express = require('express')
const app = express()
const port = 3000
const mysql = require('mysql')
const cors = require('cors')
const {body,param,validationResult} = require("express-validator")

app.use(express.json())

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sk_projekt'
    })

function handleValidationErrors(req, res) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

//olvasok lekerdezese
app.get('/olvaso', (req, res) => {
    const sql=`SELECT * from olvaso`
    pool.query(sql, (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})

//konyvek lekerdezes
app.get('/konyv', (req, res) => {
    const sql=`SELECT * from konyv`
    pool.query(sql, (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})

//kolcsonzesek
app.get('/kolcsonzesek', (req, res) => {
    const sql=`SELECT * FROM kolcsonzes
INNER JOIN konyv
ON konyv.konyv_id=kolcsonzes.kolcsonzes_id
INNER JOIN olvaso
ON olvaso.olvaso_id=kolcsonzes.kolcsonzes_id;`
    pool.query(sql, (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})

//könyvre keresünk cím alapján
app.post('/konyvKeres',
        [
            body("konyv_cim").trim().isLength({min:1}).withMessage("A keresendő szöveg minimum 1 karakter!")
        ]
,  (req, res) => {
    if (handleValidationErrors(req,res)) return
    const {konyv_cim}=req.body
    const sql=`SELECT * 
                from konyv
                where konyv_cim like ?`
    pool.query(sql,[`%${konyv_cim}%`], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})


//zoltán nevűek összes kölcsönzése
app.post('/kolcsonzesKeres',
        [
            body("szemely").trim().isLength({min:1}).withMessage("A keresendő szöveg minimum 1 karakter!")
        ]
        , (req, res) => {
    if (handleValidationErrors(req,res)) return
    const {szemely}=req.body
    const sql=`SELECT *
    from olvaso
    inner join kolcsonzes
    on olvaso.olvaso_id = kolcsonzes.kolcsonzes_olvaso
    inner join konyv
    on konyv.konyv_id = kolcsonzes.kolcsonzes_konyv
    where olvaso.olvaso_nev like ?`
    pool.query(sql,[`%${szemely}%`], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})

//könyv keresése id alapján
app.post('/konyvKeresId',
    [
        body("konyv_id").trim().notEmpty().withMessage("A könyv id megadása kötelező").isInt({min:1}).withMessage("A könyv id-je csak pozitív egész szám lehet")

    ]
, (req, res) => {
    if (handleValidationErrors(req,res)) return
    const {konyv_id}=req.body
    const sql=`SELECT * 
                from konyv
                where konyv_id like ?`
    pool.query(sql,[`%${konyv_id}%`], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})

//bemenete: nap amikor kölcsönözték, és a könyv id-ja

app.post('/napKonyvKeres',
    [
        body("konyv").trim().notEmpty().withMessage("A könyv id megadása kötelező").isInt({min:1}).withMessage("A könyv id-je csak pozitív egész szám lehet"),
        body("datum").trim().notEmpty().withMessage("A dátum megadása kötelező").isDate({format:'YYYY-MM-DD'}).withMessage("A dátum formátuma:YYYY-MM-DD")

    ]
    , (req, res) => {
        if (handleValidationErrors(req,res)) return
    const {datum,konyv}=req.body
    const sql=`SELECT *
    from olvaso
    inner join kolcsonzes
    on olvaso.olvaso_id = kolcsonzes.kolcsonzes_olvaso
    inner join konyv
    on konyv.konyv_id = kolcsonzes.kolcsonzes_konyv
    where kolcsonzes.kolcsonzes_datumki=? and konyv.konyv_id=?`
    pool.query(sql,[datum,konyv], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    if(result.length===0){
        return res.status(404).json({error:"Nincs adat"})
    }
    return res.status(200).json({result})

    })

})

//konyv torlese id alapjan

app.delete('/konyvTorles/:konyv_id', (req, res) => {
    const {konyv_id}=req.params
    const sql=`delete from konyv where konyv.konyv_id =?`
    pool.query(sql,[konyv_id], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres törlés!"})

    })

})

//olvasó törlése id alapján
app.delete('/olvasoTorles/:olvaso_id', (req, res) => {
    const {olvaso_id}=req.params
    const sql=`delete from olvaso where olvaso.olvaso_id =?`
    pool.query(sql,[olvaso_id], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres törlés!"})

    })

})

//Kölcsönzés törlése id alapján
app.delete('/kolcsonzesTorles/:kolcsonzes_id', (req, res) => {
    const {kolcsonzes_id}=req.params
    const sql=`delete from kolcsonzes where kolcsonzes.kolcsonzes_id =?`
    pool.query(sql,[kolcsonzes_id], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres törlés!"})

    })

})

//kolcsonzés törlése dátum alapján
app.delete('/kolcsDatumTorles', (req, res) => {
    const {datum}=req.body
    const sql=`delete from kolcsonzes where kolcsonzes.kolcsonzes_datumki=?`
    pool.query(sql,[datum], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres törlés!"})

    })

})

//olvaso modositas
app.put('/olvasoModosit/:olvaso_id', (req, res) => {
    const {olvaso_id}=req.params
    const {olvaso_nev,olvaso_email}=req.body
    const sql=`update olvaso from set olvaso.olvaso_nev=?,olvaso.olvaso_email=? where olvaso.olvaso_id=?`
    pool.query(sql,[olvaso_nev,olvaso_email,olvaso_id], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres módosítás!"})

    })

})

//konyv modositas
app.put('/konyvModosit/:konyv_id', (req, res) => {
    const {konyv_id}=req.params
    const {konyv_cim,konyv_ev}=req.body
    const sql=`update konyv set konyv.konyv_cim=?,konyv.konyv_ev=? where konyv.konyv_id=?`
    pool.query(sql,[konyv_cim,konyv_ev,konyv_id], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres módosítás!"})

    })

})

//patch, csak rész adat módosítás: id=param, datumbe body
app.patch('/datumbeModosit/:kolcsonzes_id', (req, res) => {
    const {kolcsonzes_id}=req.params
    const {kolcsonzes_datumbe}=req.body
    const sql=`update kolcsonzes set kolcsonzes.kolcsonzes_datumbe=? where kolcsonzes.kolcsonzes_id=?`
    pool.query(sql,[kolcsonzes_datumbe,kolcsonzes_id], (err, result) => {
    if (err){
        console.log(err)
        return res.status(500).json({error:"Hiba"})
    }
    return res.status(200).json({message:"Sikeres módosítás!"})

    })

})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
