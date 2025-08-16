from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI()


@app.post("/upload/")
async def upload_file(file: UploadFile):
    """
    Accepts file
    """
    if not file:
        return JSONResponse(status_code=400, content={"message":"No file sent"})
    
    try :
        logging.info("Recieved file")
        
        
        return {
            {
                "title":"title",
                "key_points":[
                    "a point",
                    "a point",
                ],
                "critical_clauses":{
                   "Non-Compete Agreement":[
                       "a point",
                       "a pint",
                   ],
                   "Confidentiality Agreement":[
                       "a point",
                       "a point",
                   ],
                },
                "Recommendations":[
                    "a recom",
                    "a recom",
                ],
                "summary":"a full summary"
                
                
            }
        }