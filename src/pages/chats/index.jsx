import React, { useEffect, useState } from "react";
import MessageBar from "@/Components/MessageBar";
import ChatBar from "@/Components/ChatBar";
import Cookies from "nookies";
import db from "@/Config/firebase.config";
import { getDoc,doc,updateDoc, query, collection, where, getDocs, onSnapshot,orderBy } from "@firebase/firestore";
import { adminSDK } from "@/Config/firebaseAdmin";
import { useRouter } from "next/router";
import useAuth from "@/customHooks/useAuth";
import Image from "next/image";
import unknownUser from '../../assets/images/unknown-user.svg';
import styles from '../../styles/pages/chats.module.css';
import { showFriends } from "@/utils/utils";

const userRef = collection(db,'users'); // users collection reference

function areAllValuesNotNull(obj) {
    // method which verifies obj key values are not null
    return Object.values(obj).every(value => value !== null || value!=='');
}



export async function getServerSideProps(context) {
    const cookies = Cookies.get(context); // returns cookie token 
    console.log(123);
    if (!cookies.token) {
        context.res.writeHead(302, { Location: '/signup' }); // redirect to /chats endpoint if token evaluates to true 
        context.res.end();
    }

    try {
        const decodedToken = await adminSDK.auth().verifyIdToken(cookies.token);
        if (!decodedToken) {
            context.res.writeHead(302, { Location: '/signup' }); // redirect to /chats endpoint if token evaluates to true 
            context.res.end();
        }
     
        // the user is authenticated!
        console.log(decodedToken);
        const { uid } = decodedToken; // destructure token object and returns uid (user id)
        // const user = await adminSDK.auth().getUser(uid);
        // console.log(user);
        let userDocumentReference = doc(userRef,uid); // returns user document reference based on user id

        let userDocument = await getDoc(userDocumentReference); // returns user document

        if(!areAllValuesNotNull(userDocument.data())) throw new Error("User does not have account or account data not up to date");

        // const friendColRef = collection(db,'friends'); // reference to friends collection

        const friendsDocs = await showFriends(uid); // returns friends id within friend collection

        let chatData = [];

        for(const friendDoc of friendsDocs){
            const friendsDocRef = doc(db,'friends',friendDoc.id); // returns reference to document in friend collection
            const chatCol = collection(friendsDocRef,'chat'); // returns reference to chat sub collection
            // let res = await getDocs(chatCol)

            // // res.docs.forEach((element)=>{
            // // })

            // console.log(res.docs[0].data());

            let q = query(chatCol,orderBy('timestamp','desc')); 

            let res = await getDocs(q);

            chatData.push({...res.docs[0].data(),id:friendDoc.id});


        }

        

     
        return {
          props: {
            uid:uid,
            isLoggedIn: true,
            test:"SUCCESFULLas",
            decoded: decodedToken,
            chatData:chatData,
            messageData:{} // message data object
          },
        };
      } catch (error) {
        console.log("ERROR");
        console.log(error);
        context.res.writeHead(302, { Location: '/createuser' }); // redirect to /chats endpoint if token evaluates to true 
        context.res.end();
    }

    
} //


const ChatDashboard = ({ uid,isLoggedIn, test, decoded,chatData })=>{
    const { isAuthenticated,hasDetails,onSignout, state:{user} } = useAuth();
    const [messageText,setMessageText] = useState('');
    const router = useRouter();
    const [chatDataState,setChatData] = useState(chatData); // set chat data state



    const onMessageSubmit = (event)=>{
        // submits message to firebase message collection
        event.preventDefault();

        if(messageText==="") return;
    }


    const onMessageChange = (event)=>{
        event.preventDefault();

        console.log(event.target.value);
        setMessageText(event.target.value);
    }



    return (
        <main className={styles.main}>
            <div className={styles['inner-container']}>
                <div className={styles['chats-container']}>
                        {chatDataState.map(element=>(
                            <a style={{textDecoration:"none",color:"#000"}} href={`/chats/${element.id}`}>
                                <MessageBar senderImage="" message={element.message}/>
                            </a>
                        ))}
                </div>
                {/* <div className={styles['messages-container']}>
                    <div id="user-messages-container" className={styles['user-messages-container']}>
                    </div>
                    <ChatBar onMessageChange={onMessageChange}/>
                </div> */}

                <div id="profile" className={styles['profile-actions']}>
                    <Image src={unknownUser}/>

                    <div id="profile-actions-container">
                        <div className="actions">Show Profile</div>
                        <div className="account-information">Account Information</div>
                        <div className="actions" onClick={onSignout}>Logout</div>
                        <div>{user?.displayName}</div>
                    </div>
                </div>
            </div>
        </main>
    )
}



export default ChatDashboard;