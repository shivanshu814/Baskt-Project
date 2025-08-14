'use client';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div>
        <div className="loader">
          <span>
            <span />
            <span />
            <span />
            <span />
          </span>
          <div className="base">
            <span />
            <div className="face" />
          </div>
        </div>
        <div className="longfazers">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <p className="loading-text">Getting Things Ready....</p>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0f0f0f;
  position: relative;

  --grad: linear-gradient(90deg, #ff4646, #ff07fb, #8949ff);

  .loader {
    position: relative;
    animation: speeder 0.4s linear infinite;
  }
  .loader > span {
    height: 5px;
    width: 35px;
    background: var(--grad);
    position: absolute;
    top: -19px;
    left: 60px;
    border-radius: 2px 10px 1px 0;
  }
  .base span {
    position: absolute;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-right: 100px solid transparent;
    background: none;
    border-image: var(--grad) 1;
    -webkit-mask-image: linear-gradient(#fff, #fff);
  }
  .base span:before {
    content: '';
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: var(--grad);
    position: absolute;
    right: -110px;
    top: -16px;
    box-shadow: 0 0 15px rgba(255, 7, 251, 0.8);
  }
  .base span:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-top: 0 solid transparent;
    border-right: 55px solid transparent;
    top: -16px;
    right: -98px;
    background: none;
    border-image: var(--grad) 1;
  }
  .face {
    position: absolute;
    height: 20px;
    width: 20px;
    background: var(--grad);
    border-radius: 20px 20px 20px 20px;
    transform: rotate(-40deg);
    right: -125px;
    top: -15px;
  }

  /* Fazer lines */
  .loader > span > span {
    width: 30px;
    height: 1px;
    background: var(--grad);
    position: absolute;
  }
  .loader > span > span:nth-child(1) {
    animation: fazer1 0.2s linear infinite;
  }
  .loader > span > span:nth-child(2) {
    top: 3px;
    animation: fazer2 0.4s linear infinite;
  }
  .loader > span > span:nth-child(3) {
    top: 1px;
    animation: fazer3 0.4s linear infinite;
    animation-delay: -1s;
  }
  .loader > span > span:nth-child(4) {
    top: 4px;
    animation: fazer4 1s linear infinite;
    animation-delay: -1s;
  }

  /* Animations for fazers */
  @keyframes fazer1 {
    0% {
      left: 0;
    }
    100% {
      left: -80px;
      opacity: 0;
    }
  }
  @keyframes fazer2 {
    0% {
      left: 0;
    }
    100% {
      left: -100px;
      opacity: 0;
    }
  }
  @keyframes fazer3 {
    0% {
      left: 0;
    }
    100% {
      left: -50px;
      opacity: 0;
    }
  }
  @keyframes fazer4 {
    0% {
      left: 0;
    }
    100% {
      left: -150px;
      opacity: 0;
    }
  }

  @keyframes speeder {
    0% {
      transform: translate(2px, 1px) rotate(0deg);
    }
    10% {
      transform: translate(-1px, -3px) rotate(-1deg);
    }
    20% {
      transform: translate(-2px, 0px) rotate(1deg);
    }
    30% {
      transform: translate(1px, 2px) rotate(0deg);
    }
    40% {
      transform: translate(1px, -1px) rotate(1deg);
    }
    50% {
      transform: translate(-1px, 3px) rotate(-1deg);
    }
    60% {
      transform: translate(-1px, 1px) rotate(0deg);
    }
    70% {
      transform: translate(3px, 1px) rotate(-1deg);
    }
    80% {
      transform: translate(-2px, -1px) rotate(1deg);
    }
    90% {
      transform: translate(2px, 1px) rotate(0deg);
    }
    100% {
      transform: translate(1px, -2px) rotate(-1deg);
    }
  }

  /* Long fazers */
  .longfazers {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .longfazers span {
    position: absolute;
    height: 2px;
    width: 20%;
    background: var(--grad);
    box-shadow: 0 0 10px rgba(255, 7, 251, 0.6);
  }
  .longfazers span:nth-child(1) {
    top: 20%;
    animation: lf 0.6s linear infinite;
    animation-delay: -5s;
  }
  .longfazers span:nth-child(2) {
    top: 40%;
    animation: lf2 0.8s linear infinite;
    animation-delay: -1s;
  }
  .longfazers span:nth-child(3) {
    top: 60%;
    animation: lf3 0.6s linear infinite;
  }
  .longfazers span:nth-child(4) {
    top: 80%;
    animation: lf4 0.5s linear infinite;
    animation-delay: -3s;
  }

  @keyframes lf {
    0% {
      left: 200%;
    }
    100% {
      left: -200%;
      opacity: 0;
    }
  }
  @keyframes lf2 {
    0% {
      left: 200%;
    }
    100% {
      left: -200%;
      opacity: 0;
    }
  }
  @keyframes lf3 {
    0% {
      left: 200%;
    }
    100% {
      left: -100%;
      opacity: 0;
    }
  }
  @keyframes lf4 {
    0% {
      left: 200%;
    }
    100% {
      left: -100%;
      opacity: 0;
    }
  }

  /* Loading text */
  .loading-text {
    margin-top: 40px;
    margin-left: 7rem;
    font-size: 1.5rem;
    font-weight: bold;
    background: var(--grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: flex;
    gap: 3px;
    animation: glowText 1.5s ease-in-out infinite alternate;
  }
`;

export default Loader;
