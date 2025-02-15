import React, { useEffect } from 'react'
import MainContext from './MainContext'
import { useState } from 'react'
import { SERVER_URL, socket } from '../services/helper'
import { useRef } from 'react'

const MainState = (props) => {

    const authToken = localStorage.getItem("auth-token")
    const sessionUserID = sessionStorage.getItem('sessionUserID')

    const [post, setPost] = useState([]);

    const handleStaticPostRemove = (id) => {
        const updatedItems = post.filter((item) => item._id !== id);
        setPost(updatedItems);
    }

    const pageLimit = 5

    const [totalMyPostData, setTotalMyPostData] = useState(0)

    const fetchMyPostData = (isNew) => {

        let pageNo = Math.ceil(post.length / pageLimit) + 1;

        fetch(`${SERVER_URL}post/fetch-my-post/${isNew ? 1 : pageNo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': localStorage.getItem('auth-token')
            }
        })
            .then(res => res.json())
            .then((newData) => {

                isNew ? setPost(newData.myPost) : setPost([...post, ...newData.myPost])
                setTotalMyPostData(newData.myPostLength)

            })
            .catch((err) => console.error(err));
    };

    const [notification, setNotification] = useState({})

    const [temporaryAuthToken, setTemporaryAuthToken] = useState("")

    const generateOTP = async () => {
        const response = await fetch(`${SERVER_URL}otp/create`, {
            method: 'POST',
            headers: {
                'auth-token': temporaryAuthToken,
                'Content-Type': 'application/json'
            }
        });

        const json = await response.json()

        if (json.success) {
            setNotification({ status: "true", message: "OTP Sent", type: "success" })
        }

    }

    const [userProfileData, setUserProfileData] = useState({})

    const [sessionPartner, setSessionPartner] = useState({})

    const fetchSessionUserProfile = async () => {
        const response = await fetch(`${SERVER_URL}user/get-user-profile`, {
            method: 'POST',
            headers: {
                "auth-token": authToken,
                "Content-Type": "application/json"
            }
        })

        const json = await response.json().then(data => {
            setUserProfileData(data.user)
            setSessionPartner(data.partner)
        })

    }

    const [fetchedPost, setFetchedPost] = useState([])

    const fetchAllPostHomePage = async () => {

        const response = await fetch(`${SERVER_URL}post/fetch-all-post-user`, {
            method: 'POST',
            headers: {
                'auth-token': authToken,
                'Content-Type': 'application/json'
            }
        });

        const json = await response.json()
        if (json) {
            setFetchedPost(json)
        }

    }

    const [otherUserProfile, setOtherUserProfile] = useState({})

    const [partner, setPartner] = useState({})

    const fetchAnotherUserProfile = async (userID) => {

        const response = await fetch(`${SERVER_URL}user/get-profile-of/${userID}`, {
            method: 'POST',
            headers: {
                'auth-token': authToken,
                'Content-Type': 'application/json'
            }
        });

        const json = await response.json()

        if (json.success) {
            setOtherUserProfile(json.userProfile)
            setPartner(json.partner)
        } else {
            setNotification({ status: "true", message: "OTP Sent", type: "success" })
        }

    }



    // Comment Api

    const [commentingStatus, setCommentingStatus] = useState(false)
    const [commentUploaded, setCommentUploaded] = useState(false)

    const createNewComment = async (postID, comment) => {

        setCommentingStatus(true)

        const response = await fetch(`${SERVER_URL}comment/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': authToken
            },
            body: JSON.stringify({ "commentText": comment, "postID": postID })
        })

        const json = await response.json()

        if (json.success) {
            setCommentUploaded(true)
            setCommentingStatus(false)
        } else {
            setNotification({ status: "true", message: `${json.error}`, type: "error" })
            setCommentingStatus(false)
        }

    }

    const [chatNotificationCount, setChatNotificationCount] = useState(0)

    const [allChat, setAllChat] = useState([])

    const fetchAllChat = async () => {

        const response = await fetch(`${SERVER_URL}chat/fetch-all-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': authToken
            }
        })

        const json = await response.json()

        if (json) {
            setAllChat(json)
            const data = json?.filter(data => data.newMessage === true && data.newMessageBy != sessionUserID)
            setChatNotificationCount(data.length)
        }

    }

    // mutual followers

    const [mutualDataList, setMutualDataList] = useState([])

    const fetchMutualDataList = () => {

        fetch(`${SERVER_URL}follow/fetch-mutual-follow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': authToken
            }
        })
            .then(res => res.json())
            .then(json => setMutualDataList(json))

    }

    // IO handlers

    const [socketConnected, setSocketConnected] = useState(false)

    useEffect(() => {
        if (authToken) {
            fetchSessionUserProfile()
        }
    }, [])

    useEffect(() => {

        if (userProfileData) {

            socket.emit('setup', userProfileData)

            socket.emit('is-connected', userProfileData._id)

            socket.on('connected', () => setSocketConnected(true))


        }

    }, [userProfileData])

    return (

        <MainContext.Provider value={{
            temporaryAuthToken,
            setTemporaryAuthToken,
            notification,
            setNotification,
            generateOTP,
            userProfileData,
            sessionPartner,
            fetchSessionUserProfile,
            fetchedPost,
            fetchAllPostHomePage,
            otherUserProfile,
            partner,
            totalMyPostData,
            fetchMyPostData,
            fetchAnotherUserProfile,
            post,
            setPost,
            handleStaticPostRemove,
            createNewComment,
            commentingStatus,
            commentUploaded,
            allChat,
            setAllChat,
            fetchAllChat,
            chatNotificationCount,
            mutualDataList,
            fetchMutualDataList
        }}>

            {props.children}

        </MainContext.Provider>
    )
}

export default MainState