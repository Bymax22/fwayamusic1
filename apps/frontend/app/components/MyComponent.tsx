import { useEffect, useState } from 'react';

const MyComponent: React.FC = () => {
    const [nonce, setNonce] = useState<string>('');

    useEffect(() => {
        const fetchNonce = async () => {
            try {
                const response = await fetch('/api/generate-nonce');
                const data = await response.json();
                setNonce(data.nonce);
            } catch (error) {
                console.error("Error fetching nonce:", error);
            }
        };

        fetchNonce();
    }, []);

    return (
        <>
            {nonce && (
                <script nonce={nonce}>
                    console.log(&ldquo;Inline script executed with nonce:&ldquo;, nonce);
                </script>
            )}
            <h1>Hello&ldquo; World!</h1>
            {/* Other component code */}
        </>
    );
};

export default MyComponent;
