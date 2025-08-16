import fitz 

file_path = ""
all_text = ""

try:
    with fitz.open(file_path=file_path) as doc:
        print("Opened")
        
        for page_num, page in enumerate(doc):
            
            text = page.get_text()
            
            all_text += text
            
            
            print("page")
            print(text)
            

except FileNotFoundError:
    print("Error file is not found")
    
except Exception as e:
    print(f"Exception : {e}")