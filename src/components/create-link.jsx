import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog.jsx";
import {Input} from "@/components/ui/input";
import {Card} from "./ui/card";
import {useNavigate, useSearchParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import Error from "./error";
import * as yup from "yup";
import useFetch from "@/components/hooks/use-fetch";
import {createUrl} from "@/db/apiUrls";
import {BeatLoader} from "react-spinners";
import {UrlState} from "@/context";
import {QRCode} from "react-qrcode-logo";

export function CreateLink() {
    const {user} = UrlState();

    const navigate = useNavigate();
    const ref = useRef();

    let [searchParams, setSearchParams] = useSearchParams();
    const longLink = searchParams.get("createNew");

    const [errors, setErrors] = useState({});
    const [formValues, setFormValues] = useState({
        title: "",
        longUrl: longLink ? longLink : "",
        customUrl: "",
    });

    const schema = yup.object().shape({
        title: yup.string().required("Title is required"),
        longUrl: yup
            .string()
            .url("Must be a valid URL")
            .required("Long URL is required"),
        customUrl: yup.string(),
    });

    const handleChange = (e) => {
        setFormValues({
            ...formValues,
            [e.target.id]: e.target.value,
        });
    };

    const {
        loading,
        error,
        data,
        fn: fnCreateUrl,
    } = useFetch(createUrl, {...formValues, user_id: user.id});

    useEffect(() => {
        if (!error && data) {
            navigate(`/link/${data[0].id}`);
        }
    }, [error, data, navigate]);

    const createNewLink = async () => {
        setErrors([]); // Reset errors on every submit attempt
        try {
            await schema.validate(formValues, {abortEarly: false}); // Validate form

            const canvas = ref.current?.canvasRef?.current;
            if (!canvas) {
                throw new Error('QR Code canvas is not available.');
            }

            // Convert canvas to blob
            const blob = await new Promise((resolve) => canvas.toBlob(resolve));

            // API call
            const response = await fnCreateUrl(blob);
            console.log("API response: ", response); // Add this to check the response

        } catch (e) {
            const newErrors = {};
            if (e?.inner) {
                e.inner.forEach((err) => {
                    newErrors[err.path] = err.message;
                });
            } else {
                // If the error isn't from validation, log the error
                newErrors.general = e.message;
            }
            setErrors(newErrors); // Set errors if validation fails
        }
    };

    return (
        <Dialog
            defaultOpen={longLink}
            onOpenChange={(res) => {
                if (!res) setSearchParams({});
            }}
        >
            <DialogTrigger asChild>
                <Button variant="destructive">Create New Link</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-bold text-2xl">Create New</DialogTitle>
                </DialogHeader>
                {formValues?.longUrl && (
                    <QRCode ref={ref} size={250} value={formValues?.longUrl} />
                )}

                <Input
                    id="title"
                    placeholder="Short Link's Title"
                    value={formValues.title}
                    onChange={handleChange}
                />
                {errors.title && <Error message={errors.title} />}
                <Input
                    id="longUrl"
                    placeholder="Enter your Loooong URL"
                    value={formValues.longUrl}
                    onChange={handleChange}
                />
                {errors.longUrl && <Error message={errors.longUrl} />}
                <div className="flex items-center gap-2">
                    <Card className="p-2">trimrr.in</Card> /
                    <Input
                        id="customUrl"
                        placeholder="Custom Link (optional)"
                        value={formValues.customUrl}
                        onChange={handleChange}
                    />
                </div>
                {error && <Error message={error.message || errors.general} />}
                <DialogFooter className={"sm:justify-start"}>
                    <Button
                        disabled={loading}
                        onClick={createNewLink}
                        variant={"destructive"}
                    >
                        {loading ? <BeatLoader size={10} color="white" /> : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
