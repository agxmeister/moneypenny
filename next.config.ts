import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/api/:resource*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "*" },
                    { key: "Access-Control-Allow-Headers", value: "*" },
                ]
            }
        ]
    }
};

export default nextConfig;
