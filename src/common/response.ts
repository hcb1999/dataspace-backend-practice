import { Injectable } from "@nestjs/common";

@Injectable()
export class ResponseMessage {
    
    response(data: any): any{
        const resultCode = 200;
        const resultMessage = 'SUCCESS';

        console.log(data);

        if(data != null){
            return Object.assign({
                resultCode, 
                resultMessage,
                data
            });
        } else {
            return Object.assign({
                resultCode, 
                resultMessage                
            });
        }
    }
}