import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";

import { MenuSection, SectionItem, StyledUserProfile, UserInfoContainer, UserMenu, UserMenuButton } from "@/styles/components/navigation/userProfile";

function UserProfile({ barbak_backend_uri, userInfo }) {
    // Replace links with Next.js Link Component ***
    const profileLink = 'https://www.reyhector.com';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const dispatch = useDispatch();

    const logoutUser = async (event) => {
        event.preventDefault();

        await axios({
            method: 'delete',
            url: `${barbak_backend_uri}/accounts/logout`,
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
                <UserInfoContainer>
                    <a 
                        href={profileLink} 
                        // Element is ignored during tab traversal
                        tabIndex={-1}>
                        <img src={userInfo.profile_image} />
                    </a>
                    <div className="userInfo">
                        <h1>{userInfo.username}</h1>
                        <h2>Software Developer | Mobile Developer | Software Engineer</h2>
                    </div>
                </UserInfoContainer>
                <a href={profileLink} className="profileLink">View Profile</a>
                <MenuSection>

                </MenuSection>
                <SectionItem onClick={logoutUser}>Sign Out</SectionItem>
            </UserMenu>
        ) }
    </StyledUserProfile>
}

export default UserProfile;