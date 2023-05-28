import { AuthButton, StyledGuestAuth } from "@/styles/components/navigation/guestAuth";

function GuestAuth() {
    return <StyledGuestAuth>
        <AuthButton href="/login">Login</AuthButton>
        <AuthButton href="/register">Register</AuthButton>
    </StyledGuestAuth>
}

export default GuestAuth;