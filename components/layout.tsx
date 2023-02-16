import Header from "./header";
import Footer from "./footer";
import LoginModal from "./login_modal";
import JoinModal from "./join_modal";
import { useState } from "react";

const Layout = ({ children }: { children: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [joinIsOpen, setJoinIsOpen] = useState(false);

  return (
    <>
      {isOpen ? (
        <LoginModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setJoinIsOpen={setJoinIsOpen}
        />
      ) : null}
      {joinIsOpen ? (
        <JoinModal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          joinIsOpen={joinIsOpen}
          setJoinIsOpen={setJoinIsOpen}
        />
      ) : null}
      <Header
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        joinIsOpen={joinIsOpen}
        setJoinIsOpen={setJoinIsOpen}
      />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
