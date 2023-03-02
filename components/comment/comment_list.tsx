import { authService, dbService } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DeleteModal from "../delete_modal";
import Grade from "../grade";
import Recomments from "./recomments";

interface CommentProps {
  comment: CommentType;
  currentUser: UserType;
}

const CommentList = ({ comment, currentUser }: CommentProps) => {
  const { content, createdAt, userId, id, isEdit } = comment;

  const [editContent, setEditContent] = useState(content);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserType>();
  const [recomments, setRecomments] = useState<CommentType[]>([]);

  const editToggle = async () => {
    await updateDoc(doc(dbService, "Comments", id as string), {
      isEdit: !isEdit,
    });
  };

  const editComment = async (id: string, edit: any) => {
    if (edit.trim() !== "") {
      await updateDoc(doc(dbService, "Comments", id), {
        ...comment,
        content: edit,
        isEdit: false,
      });
      setEditContent("");
    }
  };

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

    setEditContent(value);
  };

  useMemo(() => {
    if (editContent) {
      const editDefaultLength = editContent.split("\n").length;
      if (editDefaultLength > 3) {
        setResizeTextArea({
          ...resizeTextArea,
          rows: 3,
        });
      } else {
        setResizeTextArea({
          ...resizeTextArea,
          rows: editDefaultLength,
        });
      }
    }
  }, [editContent]);

  const deleteToggle = () => {
    setDeleteConfirm(!deleteConfirm);
  };

  const deleteComment = async (id: string) => {
    await deleteDoc(doc(dbService, "Comments", id));

    const recommentId = recomments
      .filter((i) => i.commentId === id)
      .map((i) => i.id);

    recommentId.map(async (id) => {
      await deleteDoc(doc(dbService, "Recomments", id as string));
    });
  };

  const getCommentUser = async () => {
    if (comment?.userId) {
      const userRef = doc(dbService, "Users", comment?.userId! as string);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const newUser = {
        ...userData,
      };

      setUser(newUser);
    }
  };

  const resetToggle = async () => {
    await updateDoc(doc(dbService, "Comments", id as string), {
      isEdit: false,
    });
    setDeleteConfirm(false);
  };

  const getRecomments = async () => {
    const q = query(
      collection(dbService, "Recomments"),
      orderBy("createdAt", "asc"),
      where("commentId", "==", id as string)
    );

    onSnapshot(q, (snapshot) => {
      // q (쿼리)안에 담긴 collection 내의 변화가 생길 때 마다 매번 실행됨
      const newRecomments = snapshot.docs.map((doc: any) => {
        const newRecomment = {
          id: doc.id,
          ...doc.data(), // doc.data() : { text, createdAt, ...  }
        };
        return newRecomment;
      });
      setRecomments(newRecomments);
    });
  };

  const onClickReportComment = async () => {
    if (authService.currentUser?.uid) {
      const snapshot = await getDoc(
        doc(dbService, "ReportComments", id as string)
      );
      const snapshotdata = await snapshot.data();
      const pastComment = {
        ...snapshotdata,
      };

      if (pastComment.reporter) {
        if (pastComment.reporter.includes(authService.currentUser?.uid)) {
          alert("이미 신고한 댓글입니다.");
          return;
        } else {
          pastComment.reporter.push(authService.currentUser?.uid);
          await updateDoc(doc(dbService, "ReportComments", id as string), {
            reporter: pastComment.reporter,
          });
          alert("새로운 신고자!");
        }
      } else if (!pastComment.reporter) {
        const newComments = {
          commentId: id,
          postId: comment.postId,
          content: comment.content,
          reporter: [authService.currentUser?.uid],
        };
        await setDoc(
          doc(dbService, "ReportComments", id as string),
          newComments
        );
        alert("신고 완료");
      }
    } else {
      alert("로그인이 필요한 서비스입니다.");
    }
  };

  useEffect(() => {
    resetToggle();
    getCommentUser();
    getRecomments();
    return;
  }, []);

  return (
    <>
      <li className="flex flex-col items-center justify-center py-6 border-b border-borderGray last:border-b-0 pr-6">
        <div className="flex space-x-3 sm:space-x-6 justify-between w-full">
          <Link
            href={`/users/${comment.userId}`}
            className="flex flex-col items-center space-y-2 w-[30%] md:w-[11%]"
          >
            {user?.imageURL && (
              <Image
                width={48}
                height={48}
                alt=""
                src={user?.imageURL as string}
                className="bg-slate-300 w-[32px] sm:w-[40px] aspect-square rounded-full object-cover"
              />
            )}
            <div className="flex justify-start items-center space-x-1">
              <span className="text-xs">{user?.nickname}</span>
              <span className="w-[8px] sm:w-[12px]">
                <Grade score={user?.point!} />
              </span>
            </div>
          </Link>
          <div className="space-y-6 flex flex-col justify-between w-full">
            {isEdit ? (
              <textarea
                name="editContent"
                value={editContent}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded border border-phGray h-auto scrollbar-none resize-none focus-visible:outline-none text-xs sm:text-base"
                rows={resizeTextArea.rows}
                placeholder={content}
              />
            ) : (
              <pre className="whitespace-pre-wrap break-all text-xs sm:text-base">
                {content}
              </pre>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-gray-500 flex items-end">
                {createdAt}
              </span>
              {isEdit && (
                <div className="flex justify-end items-end space-x-2">
                  <button
                    className="text-xs font-medium hover:text-black text-textGray"
                    onClick={editToggle}
                  >
                    취소
                  </button>
                  <button
                    className="text-xs font-medium hover:text-black text-textGray"
                    onClick={() => editComment(id as string, editContent)}
                  >
                    완료
                  </button>
                </div>
              )}
              {authService.currentUser?.uid === userId ? (
                <div
                  className={`${
                    isEdit ? "hidden" : "flex"
                  } flex justify-end items-end space-x-2 text-xs`}
                >
                  <button
                    onClick={editToggle}
                    className="hover:text-black text-textGray"
                  >
                    수정
                  </button>
                  <button
                    onClick={deleteToggle}
                    className="hover:text-black text-textGray"
                  >
                    삭제
                  </button>
                  {recomments.length === 0 ? (
                    <button
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      className={`${
                        isOpen ? "text-black" : "text-textGray"
                      } hover:text-black`}
                    >
                      답글달기
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      className={`${
                        isOpen ? "text-black" : "text-textGray"
                      } hover:text-black`}
                    >
                      답글 {recomments.length}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-end items-end space-x-2 text-gray-500 text-xs">
                  <button onClick={onClickReportComment}>신고</button>
                  {recomments.length === 0 ? (
                    <button
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      className={`${isOpen ? "text-black" : "text-textGray"}`}
                    >
                      답글달기
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      className={`${isOpen ? "text-black" : "text-textGray"}`}
                    >
                      답글 {recomments.length}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {deleteConfirm && (
          <DeleteModal
            deleteComment={deleteComment}
            setDeleteConfirm={setDeleteConfirm}
            id={id}
            text="댓글"
            content="삭제한 댓글은 복원이 불가합니다."
          />
        )}
        {isOpen && (
          <Recomments
            id={id!}
            currentUser={currentUser}
            recomments={recomments}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            comment={comment}
          />
        )}
      </li>
    </>
  );
};

export default CommentList;
