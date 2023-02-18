import React from "react";
import moment from "moment";

const Links = () => {
  return (
    <div className="links">
      <div>
        <div className="link">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">FAQs</a>
          <a href="#">Report</a>
          <a href="#">SecondSwipe</a>
        </div>
        <div className="copyright">
          <h6>&copy; {moment().format("YYYY")} SecondSwipe</h6>
        </div>
      </div>
    </div>
  );
};

export default Links;
