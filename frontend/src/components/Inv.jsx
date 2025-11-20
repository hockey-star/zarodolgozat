import React from "react";

export default function InvModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div style={{
          width: "1920px",
          height: "1088px",
          background: "black",
          backgroundImage: `url("./src/assets/pics/HAZ.jpg")`}}>
        
        <h2 className="text-center mb-2 text-sm">OTTHON</h2>

        <div className="flex justify-between flex-1">
          
          <div
          style={{
          width: "80%",
          height: "80%",
          
          
          
          }}>

                          <div
                      className="absolute cursor-pointer group"
                      style={{
                        left: "5%",
                        bottom: "5%",
                        width: "325px",
                        height: "600px",
                        
                      }}
                      onClick={onClose}
                    >
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                      ajtó
                      </div>
                    </div>

                    <div
                      className="absolute cursor-pointer group"
                      style={{
                        left: "25%",
                        bottom: "5%",
                        width: "250px",
                        height: "500px",
                        
                        backgroundSize: "cover"
                      }}
                      
                    >
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                      karakter
                      </div>
                    </div>
                      {/*Láda*/}
                    <div
                      className="absolute cursor-pointer group"
                      style={{
                        left: "25%",
                        bottom: "14%",
                        width: "400px",
                        height: "300px",
                        color: "black"
                      }}
                      onClick={onClose}
                    >
                      
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                      LÁDA
                      </div>
                    </div>

                      {/*beáll*/}
                    <div
                      className="absolute cursor-pointer group"
                      style={{
                        right: "10%",
                        top: "5%",
                        width: "150px",
                        height: "150px",
                        
                        color:"black"
                      }}
                      onClick={onClose}
                    >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                      Beall
                      </div>
                    </div>

                    {/*ágy*/}
                    <div
                      className="absolute cursor-pointer group"
                      style={{
                        right: "10%",
                        bottom: "5%",
                        width: "650px",
                        height: "350px",
                        
                        color:"black"
                      }}
                      onClick={onClose}
                    >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition">
                      </div>
                    </div>

          </div>
        </div>
      </div>
    </div>
  );
}