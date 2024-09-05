export const ErrorCode = <K = number>(
    errorKey: K,
): any => {
    const data = Object.assign(
        {901:'권한이 없는 사용자'}
    );
    const message = data[errorKey];
    return message;
}