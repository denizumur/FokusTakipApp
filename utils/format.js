//Saniyeyi 25:00 formatına çeviren basit matematik


export const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => (num < 10 ? '0' + num : num);
    return `${pad(minutes)}:${pad(seconds)}`;
};