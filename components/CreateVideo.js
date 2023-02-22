import React, { useState, useEffect, useRef } from "react";
import { MdDelete } from "react-icons/md";
import { useAuthState } from "react-firebase-hooks/auth";
import { Configuration, OpenAIApi } from "openai";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

import { topics } from "../utils/constants";
import useSelectFile from "../hooks/useSelectFile";
import { auth, firestore, storage } from "../firebase/firebase";
import UploadeSkeleton from "./Skeleton/UploadeSkeleton";

const CreateVideo = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [topic, setTopic] = useState(topics[0].name);
  const [loading, setLoading] = useState(false);
  const [wrongFileType, setWrongFileType] = useState(false);
  const [price, setprice] = useState("");
  const [hashTags, setHashTags] = useState("");
  const [tagShow, setTagShow] = useState(false);
  const [tagError, setTagError] = useState("");
  const [getPrice, setPrice] = useState(0);
  const [selling, setSelling] = useState(0);
  const [condition, setCondition] = useState("");

  const { selectedFile, setSelectedFile, onSelectedFile } = useSelectFile();
  const selectedFileRef = useRef(null);

  const checker = caption.match(/#/g);
  const tagCheck = hashTags.match(/#/g);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: price, condition: condition, topic: topic }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }
      setPrice(data.result);
    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  const handleChecker = () => {
    if (checker) {
      setCaption(caption.replace("#", ""));
    } else {
      if (topic === "Other") {
        setTagShow(true);
        /* setHashTags(""); */

        if (tagCheck) {
          setTagError("");
        } else {
          setTagError("You Must Add a # Tag To your Custom Topic");
        }
      } else {
        setTagShow(false);
        setHashTags("#");
      }
    }
  };

  const handlePost = async (e) => {
    /* const fileTypes = ["video/mp4", "video/webm", "video/ogg"]; */

    if (caption && topic && selectedFile && tagCheck) {
      setLoading(true);

      try {
        const docRef = await addDoc(collection(firestore, "posts"), {
          userId: user?.uid,
          username: user?.displayName,
          topic: topic === "Other" ? hashTags : topic,
          price: price,
          selling: selling,
          condition: condition,
          getPrice: getPrice,
          caption: caption,
          profileImage: user?.photoURL,
          company: user?.email,
          timestamp: serverTimestamp(),
        });

        if (selectedFile) {
          const imageRef = ref(storage, `posts/${docRef.id}/image`);

          await uploadString(imageRef, selectedFile, "data_url").then(
            async (snapshot) => {
              const downloadUrl = await getDownloadURL(imageRef);
              await updateDoc(doc(firestore, "posts", docRef.id), {
                image: downloadUrl,
              });
            }
          );
        } else {
          console.log("No Image");
        }

        setCaption("");
        setTopic("");
        setSelectedFile("");
        router.push("/");
      } catch (error) {
        console.log(error);
      }
    } else {
      if (!caption) {
        toast.error("Caption field is empty", {
          duration: 3000,
          position: "bottom-right",
          style: {
            background: "#fff",
            color: "#015871",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
      } else if (!tagCheck) {
        toast.error("Your HashTag type is wrong", {
          duration: 3000,
          position: "bottom-right",
          style: {
            background: "#fff",
            color: "#015871",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
      } else {
        toast.error("Topic field is empty", {
          duration: 3000,
          position: "bottom-right",
          style: {
            background: "#fff",
            color: "#015871",
            fontWeight: "bolder",
            fontSize: "17px",
            padding: "20px",
          },
        });
      }
    }
    setLoading(false);
  };

  const handleDiscard = () => {
    setCaption("");
    setTopic("");
    setHashTags("");
    setprice("");
  };

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else return;
  }, [user]);

  useEffect(() => {
    handleChecker();
  }, [caption, topic, hashTags]);

  return (
    <div className="flex w-full h-full  absolute left-0 top-[60px] lg:top-[70px] mb-10 pt-2 lg:pt-8 justify-center">
      <Toaster />
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white rounded-lg xl:h-[80vh] flex gap-6 flex-wrap justify-center items-center p-14 pt-6"
      >
        <div>
          <div>
            <p className="text-2xl font-bold">Upload Video</p>
            <p className="text-md text-gray-400 mt-1">
              Post a video to your account
            </p>
          </div>
          <div className="rounded-xl border-4 border-gray-200 flex flex-col justify-center items-center  outline-none mt-10 w-[260px] h-[400px] pl-10 pr-10 cursor-pointer hover:bg-gray-100">
            {loading ? (
              <>
                <img className="loader" src="https://i.ibb.co/LCMbLSF/loading.gif" />
              </>
            ) : (
              <div>
                {!selectedFile ? (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="flex flex-col justify-center items-center">
                        <p className="font-bold text-xl">
                          {/* <FaCloudUploadAlt className='text-gray-300 text-6xl' /> */}
                        </p>
                        <p className="text-xl font-semibold">
                          Select Video
                        </p>
                      </div>

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 mt-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                      </svg>

                      <p className="text-gray-400 text-center mt-4 text-sm leading-10">
                        MP4 or WebM or ogg <br />
                        Up to 10 minutes <br />
                        Less than 2 GB
                      </p>
                      <p className="buy-button">
                        Select File
                      </p>
                    </div>
                    <input
                      type="file"
                      name="upload-video"
                      ref={selectedFileRef}
                      className="w-0 h-0"
                      onChange={onSubmit}
                    />
                  </label>
                ) : (
                  <div className=" rounded-3xl w-[300px]  p-4 flex flex-col gap-6 justify-center items-center">
                    <video
                      className="rounded-xl h-[383px] w-[245px] mt-16 bg-black"
                      controls
                      loop
                      src={selectedFile}
                    />
                    <div className=" flex justify-between gap-20">
                      <button
                        type="button"
                        className="buy-button"
                        onClick={() => setSelectedFile("")}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {wrongFileType && (
            <p className="text-center text-xl text-red-400 font-semibold mt-4 w-[260px]">
              Please select a video file (mp4 or webm or ogg)
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 mt-24">
          <label className="text-md font-medium ">Caption</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="rounded lg:after:w-650 outline-none text-md border-2 border-gray-200 p-2"
          />
          <label className="text-md font-medium ">Original Price (in USD)</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setprice(e.target.value)}
            className="rounded lg:after:w-650 outline-none text-md border-2 border-gray-200 p-2"
          />
          <label className="text-md font-medium ">Choose Category</label>
          <select
            onChange={(e) => {
              setTopic(e.target.value);
            }}
            className="outline-none lg:w-650 border-2 border-gray-200 text-md capitalize lg:p-4 p-2 rounded cursor-pointer"
          >
            {topics.map((item) => (
              <option
                key={item.name}
                className=" outline-none capitalize bg-white text-gray-700 text-md p-2 hover:bg-slate-300"
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>
          <label className="text-md font-medium ">In a few words, describe the condition of the product.</label>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="rounded lg:after:w-650 outline-none text-md border-2 border-gray-200 p-2"
          />
          {tagShow && (
            <>
              <input
                type="text"
                value={hashTags}
                placeholder="Add Custom Topic"
                onChange={(e) => setHashTags(e.target.value)}
                className="rounded lg:after:w-650 outline-none text-md border-2 border-gray-200 p-2 "
              />
              {tagError && <p className="text-red-500 text-xs">{tagError}</p>}
            </>
          )}
        </div>
        <div className="selling">
          <h1>AI Suggested Selling Price</h1>
          <div className="AIBox">
            ${getPrice}
          </div>
          <label className="text-md font-medium "> Choose Selling Price</label>
          <input
            type="text"
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
            className="rounded lg:after:w-650 outline-none text-md border-2 border-gray-200 p-2"
          />
          {loading ? (
            <img className="loader" src="https://i.ibb.co/LCMbLSF/loading.gif" />
          ) : (
            <div className={tagError ? `flex mt-5` : `flex mt-5`}>
              <button
                onClick={handleDiscard}
                type="button"
                className="upload-btn"
              >
                Discard
              </button>
              <button
                disabled={selectedFile ? false : true}
                onClick={handlePost}
                type="button"
                className="login-btn"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CreateVideo;
