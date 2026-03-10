import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="h-full flex items-center justify-center bg-zinc-50 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-sm border-zinc-200 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="text-center pt-10">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-zinc-100 rounded-full border border-zinc-200">
                            <ShieldAlert className="h-10 w-10 text-black" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-black tracking-tight">Access Denied</CardTitle>
                    <CardDescription className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-2">
                        403 - Unauthorized Request
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-zinc-600 font-medium pb-2">
                        You do not have the necessary permissions to view this page. If you believe this is an error, please contact your administrator.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center pb-10">
                    <Button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white rounded-full font-bold px-8 py-6 h-auto shadow-md transition-all hover:-translate-y-0.5"
                    >
                        Return to Dashboard
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Unauthorized;
