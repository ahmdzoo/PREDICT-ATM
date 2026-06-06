const sizes = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`${sizes[size]} rounded-full border-emerald-500 border-t-transparent animate-spin`}
            />
        </div>
    );
}
