import axios from 'axios';
import { showAlert } from './alert';
export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:8000/api/v1/users/login',
            data: {
                email,
                password
            }
        });
        console.log(res);

        if (res.data.status === 'success') {
            showAlert('success','Logged in success!');
            
            window.setTimeout(() => {
                location.assign('/')
            }, 1500);
        }

        // const res = await axios.post('http://localhost:8000/api/v1/users/login', {
        //     email, password
        // }, {
        //     withCredentials: true
        // })
        // console.log(res);

    } catch(err) {
        showAlert('error', err.response.data.message);
    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:8000/api/v1/users/logout'
        })
        
        if (res.data.status = 'success') {
            showAlert('success', 'Logged out!')
            location.reload(true);
        }

    } catch(err) {
        console.log(err.response)
        showAlert('error', 'Error logging out!');
    }
}
