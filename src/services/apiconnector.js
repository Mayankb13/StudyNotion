// import axios from "axios"

// export const axiosInstance = axios.create({});

// export const apiConnector = (method, url, bodyData, headers, params) => {
//     return axiosInstance({
//         method: `${method}`,
//         url: `${url}`,
//         data: bodyData ? bodyData : null,
//         headers: headers ? headers : null,
//         params: params ? params : null,
//     });
// }

import axios from "axios"

// export const axiosInstance = axios.create({});

export const apiConnector = async (method, url, bodyData, headers, params) => {
    console.log(method, url, bodyData);
    const response =  await axios({
        method: `${method}`,
        url: `${url}`,
        data: bodyData,
        headers: headers,
        params: params,
    });
    console.log("the response in apiconnector : " , response);
    return response;
}