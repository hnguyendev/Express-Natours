import axios from 'axios';
import { showAlert } from './alert';

// type is either password or data
export const updateSettings = async(data, type) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: type === 'password' ? 'http://localhost:8000/api/v1/users/updatepassword' : 'http://localhost:8000/api/v1/users/updateme',
            data
        });
        
        if (res.data.status === 'success') {
            showAlert('success', `Update ${type.toUpperCase()} success!`)
            location.reload('/me')
        }

    } catch(err) {
        console.log(err)
        showAlert('error', err.response.data.message)
    }
}