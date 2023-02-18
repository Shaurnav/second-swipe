import React, { useState, useEffect } from "react";
import { faker } from "@faker-js/faker";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";

import { GiHouse, GiThorHammer, GiBallHeart } from "react-icons/gi";

import { auth } from "../firebase/firebase";
import {GiAngelOutfit} from "react-icons/gi/index";

const Btns = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const suggestions = [...Array(5)].map((_, i) => ({
      userId: faker.datatype.uuid(),
      username: faker.internet.userName(),
      avatar: faker.image.avatar(),
      id: i,
    }));
    setSuggestions(suggestions);
  }, []);
  return (
    <>
      <div className="btns">
        <a href="#" className="flex gap-2">
            <span className="font-bold text-2xl xl:text-md "><GiHouse /></span>
            <span className={`font-medium text-md hidden xl:block capitalize`}>
              For You
            </span>
        </a>
        <a href="#" className="flex gap-2">
          <span className="font-bold text-2xl xl:text-md "><GiBallHeart /></span>
          <span className={`font-medium text-md hidden xl:block capitalize`}>
              Following
          </span>
        </a>
        <a href="#" className="flex gap-2">
          <span className="font-bold text-2xl xl:text-md "><GiThorHammer /></span>
          <span className={`font-medium text-md hidden xl:block capitalize`}>
              Live Bids
          </span>
        </a>
      </div>

      <div className="accounts">
        <p>Suggested Creators</p>
        {suggestions.map((data, index) => (
          <div className="user" key={index}>
            <img src={data.avatar} alt="avatar" />
            <h6 className="username">{data.username}</h6>
          </div>
        ))}
      </div>
    </>
  );
};

export default Btns;
