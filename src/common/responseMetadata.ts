import { Injectable } from "@nestjs/common";

@Injectable()
export class ResponseMetadata {
    
    response(data: any): any{
        // const resultCode = 200;
        // const resultMessage = 'SUCESS';

        console.log(data);

        const description = data.description;
        const name = data.name;
        const image = data.image;

        if(data != null){
            return Object.assign({
                // resultCode, 
                // resultMessage,
                // data
                description,
                name,
                image
            });
        } else {
            return Object.assign({
                // resultCode, 
                // resultMessage
            });
        }
    }
}