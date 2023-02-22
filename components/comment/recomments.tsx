import { authService, dbService } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";
import { SetStateAction, useEffect, useState } from "react";
import RecommentList from "./recomment_list";

interface RecommentPropsType {
  id: string;
  currentUser: UserType;
  recomments: CommentType[];
  isOpen: boolean;
  setIsOpen: React.Dispatch<SetStateAction<boolean>>;
}

const Recomments = ({
  id,
  recomments,
  setIsOpen,
  isOpen,
}: RecommentPropsType) => {
  const date = Date.now();
  const dateForm = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "medium",
  }).format(date);
  const initialRecomment = {
    content: "",
    commentId: "",
    userId: "",
    createdAt: "",
    isEdit: false,
  };

  const [recomment, setRecomment] = useState<CommentType>(initialRecomment);
  const [resizeTextArea, setResizeTextArea] = useState({
    rows: 1,
    minRows: 1,
    maxRows: 3,
  });

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const textareaLineHeight = 24;
    const { minRows, maxRows } = resizeTextArea;

    const previousRows = event.target.rows;
    event.target.rows = minRows;

    const currentRows = ~~(event.target.scrollHeight / textareaLineHeight);

    if (currentRows === previousRows) {
      event.target.rows = currentRows;
    }

    if (currentRows >= maxRows) {
      event.target.rows = maxRows;
      event.target.scrollTop = event.target.scrollHeight;
    }

    setResizeTextArea({
      ...resizeTextArea,
      rows: currentRows < maxRows ? currentRows : maxRows,
    });
    setRecomment({
      ...recomment,
      [name]: value,
    });
  };

  const addRecomment = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const newRecomment = {
      content: recomment.content,
      commentId: id,
      userId: authService.currentUser?.uid,
      createdAt: dateForm,
      isEdit: false,
    };
    if (recomment.content.trim() !== "") {
      await addDoc(collection(dbService, "Recomments"), newRecomment);
    } else {
      alert("내용이 없습니다!");
    }
    setRecomment(initialRecomment);
    setResizeTextArea({
      ...resizeTextArea,
      rows: 1,
    });
  };

  return (
    <div className="w-10/12 ml-auto">
      <ul className="w-full">
        {recomments.map((item) => (
          <RecommentList key={item.id} recomment={item} />
        ))}
      </ul>
      <form className="w-full flex items-center relative space-x-6 mt-6">
        <textarea
          disabled={authService.currentUser ? false : true}
          name="content"
          value={recomment.content}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-phGray h-auto scrollbar-none resize-none focus-visible:outline-none"
          placeholder="답글을 입력해주세요."
          rows={resizeTextArea.rows}
        />
        <button
          disabled={authService.currentUser ? false : true}
          onClick={addRecomment}
          className="absolute right-0 bottom-3 pr-4 disabled:text-gray-400"
        >
          <span className="text-sm font-bold text-phGray hover:text-black">
            등록
          </span>
        </button>
      </form>
      <button
        onClick={() => {
          setIsOpen(false);
        }}
        className="block mx-auto mt-6 p-2 text-sm font-bold text-textGray"
      >
        답글 접기
      </button>
    </div>
  );
};

export default Recomments;
