import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg border-red-100">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <ShieldAlert className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Access Denied</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                        403 - Unauthorized Request
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-600">
                        You do not have the necessary permissions to view this page. If you believe this is an error, please contact your administrator.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Return to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Unauthorized;
