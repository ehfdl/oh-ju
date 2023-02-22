import { authService, dbService } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { use, useEffect, useState } from "react";
import { AiFillBell } from "react-icons/ai";
import AlarmModal from "./alarm_modal";

const Alarm = () => {
  const [alarm, setAlarm] = useState<AlarmType[]>([{}]);

  const [isAlarmOpenModal, setIsAlarmOpenModal] = useState(false);

  const getAlarm = async () => {
    const snapshot = await getDoc(
      doc(dbService, "Users", authService.currentUser?.uid as string)
    );
    const snapshotdata = await snapshot.data();
    const newPost = {
      ...snapshotdata,
    };
    const filterPost = newPost.alarm.sort((a: AlarmType, b: AlarmType) => {
      if (a.createdAt! < b.createdAt!) return 1;
      if (a.createdAt! > b.createdAt!) return -1;
      return 0;
    });

    setAlarm(newPost?.alarm);
  };

  useEffect(() => {
    getAlarm();
  }, [authService.currentUser?.uid]);

  return (
    <div className="mr-2">
      <AiFillBell
        onClick={() => setIsAlarmOpenModal(!isAlarmOpenModal)}
        className="w-5 h-5 cursor-pointer"
      />
      {alarm.filter((content) => content.isDone === false).length !== 0 ? (
        <div className="w-3 h-3 rounded-full bg-[#ff6161] text-[8px] text-white flex justify-center items-center pt-[1px] absolute top-7 ml-3 ">
          {alarm.filter((content) => content.isDone === false).length}
        </div>
      ) : (
        <div></div>
      )}

      {isAlarmOpenModal ? (
        <AlarmModal
          alarm={alarm}
          getAlarm={getAlarm}
          setIsAlarmOpenModal={setIsAlarmOpenModal}
        />
      ) : null}
    </div>
  );
};

export default Alarm;
