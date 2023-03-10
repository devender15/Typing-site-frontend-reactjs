import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import fetchUser from "../../utils/FetchUser";

const Sidebar = ({
  startCounting,
  correctWords,
  incorrectWords,
  totalwords,
  backspaceKeyCount,
  keystrokes,
  time,
  setStartCounting,
  setShowModal,
  setFinished,
  leaveRoomCallback,
  currentProgress,
  setCurrentProgress,
  setUserRank,
  setTopper,
  finished,
}) => {
  const score = localStorage.getItem("currentProgress")
    ? JSON.parse(localStorage.getItem("currentProgress"))
    : null;

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [accuracy, setAccuracy] = useState(score ? score?.accuracy : 0);
  const [speed, setSpeed] = useState(score ? score?.speed : 0);

  const navigate = useNavigate();

  // fetching userToken from localStorage
  const userToken = fetchUser();

  const request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + userToken,
    },
  };

  useEffect(() => {
    let id;
    if (startCounting) {
      id = setInterval(() => {
        setTimeElapsed((oldTime) => oldTime + 1);
      }, 1000);
    }
    return () => {
      clearInterval(id);
    };
  }, [startCounting]);

  const saveProgress = () => {
    // sending student's data to backend
    fetch(`${process.env.REACT_APP_API_URL}/user-auth/save-progress`, {
      ...request,
      body: JSON.stringify({
        wpm: speed,
        cpm: speed * 5,
        accuracy: accuracy,
        half_mistakes: 0,
        full_mistakes: 0,
        errors: incorrectWords,
        time_taken: timeElapsed,
      }),
    }).then((res) => {
      if (res.status === 201) {
        fetch(`${process.env.REACT_APP_API_URL}/room/get-rank`, {
          ...request,
          method: "GET",
        })
          .then((res) => res.json())
          .then((data) => {
            setUserRank(data.rank);
            setTopper(data.topper);
          });
      }
    });
  };

  useEffect(() => {
    if (timeElapsed >= time) {
      setStartCounting(false);
      setShowModal(true);
      setFinished(true);
    }
  }, [timeElapsed]);

  // saving progress to get rank when user finishes typing
  useEffect(() => {
    if (finished) {
      saveProgress();
      // saving the current progress to localStorage
      setCurrentProgress({
        ...currentProgress,
        errorCount: incorrectWords,
        cpmSpeed: speed * 5,
        speed: speed,
        accuracy: accuracy,
      });
    }
  }, [finished]);

  const minutes = timeElapsed / 60;

  useEffect(() => {
    setSpeed((prev) => {
      let newSpeed = prev;
      newSpeed = (correctWords / minutes).toFixed(2);
      return newSpeed;
    });
    setAccuracy((prev) => {
      let newAccuracy = prev;
      newAccuracy = (
        (correctWords / (correctWords + incorrectWords)) *
        100
      ).toFixed(2);
      return newAccuracy;
    });
  }, [correctWords, incorrectWords, timeElapsed]);

  const handleLeaveRoom = () => {
    if (localStorage.getItem("currentProgress"))
      localStorage.removeItem("currentProgress");

    if (localStorage.getItem("roomSettings"))
      localStorage.removeItem("roomSettings");

    fetch(`${process.env.REACT_APP_API_URL}/room/leave-room`, request).then(
      (response) => {
        if (response.ok) {
          leaveRoomCallback();
          navigate("/");
        } else {
          console.log("something went wrong!");
        }
      }
    );
  };

  return (
    <>
      <div className=" w-[25%] flex flex-col space-y-0">
        <div className="w-full flex flex-col space-y-1 items-start p-2 border-l-2 border-t-2 border-r-2 border-black text-sm">
          <p>
            <b>Keystrokes Count </b> : {keystrokes}
          </p>
          <p>
            <b>Error Count </b> : {incorrectWords}
          </p>
          <p>
            <b>Backspace Count </b> : {backspaceKeyCount}
          </p>
          <p>
            <b>Total Word Count</b> : {totalwords}
          </p>
          <p>
            <b>Typed Word Count</b> : {correctWords + incorrectWords}
          </p>
          <p>
            <b>Pending Word Count</b> :{" "}
            {totalwords - (correctWords + incorrectWords)}
          </p>
          <p>
            <b>WPM</b> : {isNaN(speed) ? 0 : speed} WPM
          </p>
          <p>
            <b>CPM</b> : {isNaN(speed) ? 0 : (speed * 5).toFixed(2)} CPM
          </p>
          <p>
            <b>Accuracy</b> : {isNaN(accuracy) ? 0 : accuracy} %
          </p>
        </div>

        <div className="flex flex-wrap text-sm p-2 border-l-2 border-b-2 border-r-2 border-black">
          <h2 className="font-semibold text-lg">Instructions</h2>
          <p>Kindly type the highlighted word to proceed further.</p>
          <p>
            Kindly note, you can edit the text contents that you have typed.
          </p>
          <p>Correct / Wrong words turn Green / Red respectively.</p>
          <p>
            Kindly note, it is mandatory for you to type the entire text content
            to submit.
          </p>
          <p>
            Upon timeout, the system will automatically save all your responses.
          </p>
        </div>
        <button
          className="px-2 py-1 text-white w-1/2 mx-auto bg-blue-400 hover:bg-blue-500 my-2"
          onClick={handleLeaveRoom}
        >
          Submit
        </button>
      </div>
    </>
  );
};

export default React.memo(Sidebar);
