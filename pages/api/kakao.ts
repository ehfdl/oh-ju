// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// import necessary modules
const request = require("axios");

// 파이어베이스 설정
const firebaseAdmin = require("firebase-admin");

// 위치는 service-account.json을 동일한 폴더 app.js에 수동으로 넣어야 합니다.
const serviceAccount = require("../../service-account.json");

// 엑세스 토큰 기반으로 사용자 프로필 조회를 위한 카카오 API 요청 url
const requestMeUrl = "https://kapi.kakao.com/v2/user/me?secure_resource=true";

// if (!firebaseAdmin.apps.length) {
if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    // requestMeUrl: requestMeUrl,
  });
}

/**
 * requestMe - Kakao API에서 사용자 프로필 반환
 *
 * @param  {String} kakaoAccessToken kakaoAccessToken Kakao 로그인 API에서 조회한 액세스 토큰
 * @return {Promiise<Response>}      Promise 사용자 프로필 응답
 */
// export function requestMe(kakaoAccessToken: any) {
//   console.log("Requesting user profile from Kakao API server.");
//   return request({
//     method: "GET",
//     headers: { Authorization: "Bearer " + kakaoAccessToken },
//     url: requestMeUrl,
//   });
// }
export function requestMe(kakaoAccessToken: any) {
  console.log("Requesting user profile from Kakao API server.");
  console.log("카카오 엑세스토큰 : ", kakaoAccessToken);
  return axios.get(requestMeUrl, {
    headers: { Authorization: "Bearer " + kakaoAccessToken },
  });
}

/**
 * updateOrCreateUser - 제공 이메일로 Firebase 사용자를 업데이트하고 다음과 같은 경우 생성
 * 존재하지 않습니다.
 *
 * * @param   { String } userId 앱별 사용자 ID
 * @param   { String } 이메일 사용자의 이메일 주소
 * @param   { 문자열 } displayName 사용자
 * @param   { String } photoURL 프로필 사진 URL
 * @return { Prommise<UserRecord> } 약속의 Firebase 사용자 레코드
 */
export function updateOrCreateUser(
  userId: any,
  email: any,
  displayName: any,
  photoURL: any
) {
  console.log("updating or creating a firebase user");
  const updateParams = {
    provider: "KAKAO",
    displayName: displayName,
    photoURL: "",
    uid: "",
    email: email,
  };
  if (displayName) {
    updateParams["displayName"] = displayName;
  } else {
    updateParams["displayName"] = email;
  }
  if (photoURL) {
    updateParams["photoURL"] = photoURL;
  }
  console.log(updateParams);
  return firebaseAdmin
    .auth()
    .updateUser(userId, updateParams)
    .catch((error: any) => {
      if (error.code === "auth/user-not-found") {
        updateParams["uid"] = userId;
        if (email) {
          updateParams["email"] = email;
        }
        console.log(updateParams);
        return firebaseAdmin.auth().createUser(updateParams);
      }
      throw error;
    });
}

/**
 * createFirebaseToken - Firebase Admin SDK를 사용하여 Firebase 토큰을 반환합니다.
 *
 * @param   { String } 카카오 로그인 API의 kakaoAccessToken 액세스 토큰
 * @return { Promise<String> } 약속의 Firebase 토큰
 */

// 1. 토큰이 서버에서 받아지는지 체크 (핸들러를 보면 된다)
// 2. 핸들러에서 리쿼스트로 바디에 들어오는지 확인할 것
//
// export function createFirebaseToken(kakaoAccessToken: any) {
//   return requestMe(kakaoAccessToken)
//     .then((response: any) => {
//       console.log("response : ", response);
//       // const body = JSON.parse(response);
//       const body = response.data;
//       console.log(body);
//       const userId = `kakao:${body.id}`;
//       if (!userId) {
//         return response
//           .status(404)
//           .send({ message: "There was no user with the given access token." });
//       }
//       let nickname = null;
//       let profileImage = null;
//       if (body.properties) {
//         nickname = body.properties.nickname;
//         profileImage = body.properties.profile_image;
//       }
//       return updateOrCreateUser(
//         userId,
//         body?.kaccount_email,
//         nickname,
//         profileImage
//       );
//     })
//     .then((userRecord: any) => {
//       const userId = userRecord.uid;
//       console.log(`creating a custom firebase token based on uid ${userId}`);
//       return firebaseAdmin
//         .auth()
//         .createCustomToken(userId, { provider: "KAKAO" });
//     });
// }

export function createFirebaseToken(kakaoAccessToken: any) {
  return axios
    .get(requestMeUrl, {
      headers: {
        Authorization: "Bearer " + kakaoAccessToken,

        // "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    })
    .then((response: any) => {
      console.log("response : ", response);
      const body = response.data;
      console.log(body);
      const userId = `kakao:${body.id}`;
      if (!userId) {
        return response
          .status(404)
          .send({ message: "There was no user with the given access token." });
      }
      let nickname = null;
      let profileImage = null;
      if (body.properties) {
        nickname = body.properties.nickname;
        profileImage = body.properties.profile_image;
        console.log(
          "-----------------------------------------------------------------"
        );
        console.log("body : ", body);
        console.log(
          "-----------------------------------------------------------------"
        );
      }
      return updateOrCreateUser(
        userId,
        body.kaccount_email,
        nickname,
        profileImage
      );
    })
    .then((userRecord: any) => {
      const userId = userRecord.uid;
      console.log(`creating a custom firebase token based on uid ${userId}`);
      return (
        firebaseAdmin
          .auth()
          // .authService
          .createCustomToken(userId, { provider: "KAKAO" })
      );
    });
}

// app.post
type Data = {
  name: string;
};

// export default function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<any>
// ) {
//   const token = req.body.token;
//   console.log("token : ", token);
//   if (!token)
//     return res.status(400).send({
//       error: "There is no token.",
//       message: "Access token is a required parameter.", // 엑세스 토큰은 필수 인자다.
//     });

//   console.log(`Verifying Kakao token: ${token}`);

//   createFirebaseToken(token).then((firebaseToken: any) => {
//     console.log(`Returning firebase token to user: ${firebaseToken}`);
//     res.send({ firebase_token: firebaseToken });
//   });
// }

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const authObj = req.body.authObj;
  console.log("authObj : ", authObj);
  if (!authObj)
    return res.status(400).send({
      message: "Missing authorization object",
    });
  createFirebaseToken(authObj.access_token)
    .then((firebaseToken: string) => {
      console.log(firebaseToken);
      console.log("파이어베이스 토큰 완성!!");
      return res.status(200).send({ firebaseToken: firebaseToken });
    })
    .catch((error: any) => {
      console.log(error);
      return res.status(400).send({ message: error });
    });
}
