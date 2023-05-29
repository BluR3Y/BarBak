import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import Link from "next/link";

import {
    MenuSection,
    SectionItem,
    StyledUserProfile,
    UserInfoContainer,
    UserMenu,
    UserMenuButton
} from "@/styles/components/navigation/userProfile";

function UserProfile({ userInfo }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const dispatch = useDispatch();
    const profileLink = 'https://www.reyhector.com';
    
    const logoutUser = async (event) => {
        event.preventDefault();

        await axios({
            method: 'delete',
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/accounts/logout`,
            withCredentials: true
        });
        dispatch({ type: 'SIGNOUT_REQUEST' });
    }

    const handleBlur = ({ currentTarget, relatedTarget }) => {
        if (!relatedTarget || !currentTarget.parentNode.contains(relatedTarget)) {
            setIsMenuOpen(!isMenuOpen);
        }
    }
    
    useEffect(() => {
        if (isMenuOpen && menuRef.current) {
            menuRef.current.focus();
        }
    }, [isMenuOpen]);

    return <StyledUserProfile>
        <UserMenuButton
            imgSrc={userInfo.profile_image}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
        />
        { isMenuOpen && (
            <UserMenu
                onBlur={handleBlur}
                tabIndex={0}
                ref={menuRef}
            >
                <MenuSection>
                    <UserInfoContainer>
                        <Link 
                            href={profileLink} 
                            // Element is ignored during tab traversal
                            tabIndex={-1}>
                            <img src={userInfo.profile_image} />
                        </Link>
                        <div className="userInfo">
                            <h1>{userInfo.username}</h1>
                            <h2>Software Developer | Mobile Developer | Software Engineer</h2>
                        </div>
                    </UserInfoContainer>
                    <Link href={profileLink} className="profileLink">View Profile</Link>
                </MenuSection>
                <MenuSection>
                    <h1 className="sectionLabel">Manage</h1>
                    <SectionItem href="">Settings</SectionItem>
                </MenuSection>
                <SectionItem href="" onClick={logoutUser}>Sign Out</SectionItem>
            </UserMenu>
        ) }
    </StyledUserProfile>
}

export default UserProfile;