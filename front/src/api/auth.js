import { BASEURL } from ".";



async function register(email, password, username) {
    
    try{
        const res = await fetch(BASEURL + "/api/auth/register",{
            method: "POST",
            credentials: "include",
            headers: {
                "Content-type": 'application/json'
            },
            body: JSON.stringify({
                email, password, username
            })
        })
        if (!res.ok) throw new Error(e)

        const data = await res.json()

        return data
    }
    catch(e){
        console.error(e);
        
    }

}