import React from "react";
import { motion } from "framer-motion";
import { ThreeDots } from "react-loader-spinner";
import container from "postcss/lib/container";

const Skeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="flex justify-center items-center"
    >
      <div className="loader-container">
        <img className="loader" src="https://i.ibb.co/LCMbLSF/loading.gif" />
      </div>
    </motion.div>
  );
};

export default Skeleton;
