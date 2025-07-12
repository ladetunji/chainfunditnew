import { cn } from "@/lib/utils";
import { Marquee } from "@/components/magicui/marquee";
import Image from "next/image";

const notifications = [
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of $1,300 from DeSean",
    paymentChannel: "/images/stripe.png",
    logo: "/images/logo.svg",
  },
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of ₦100,000 from Abdullahi",
    paymentChannel: "/images/paystack.png",
    logo: "/images/logo.svg",
  },
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of $2,000 from Carlos",
    paymentChannel: "/images/stripe.png",
    logo: "/images/logo.svg",
  },
  {
    name: "Thomas’ Tuition",
    message: "You received a donation of £300 from Jessica",
    paymentChannel: "/images/stripe.png",
    logo: "/images/logo.svg",
  },
];

const firstRow = notifications.slice(0, notifications.length / 2);
const secondRow = notifications.slice(notifications.length / 2);

const NotificationCard = ({
  logo,
  name,
  message,
  paymentChannel,
}: {
  logo: string;
  name: string;
  message: string;
  paymentChannel: string;
}) => {
  return (
    <figure
      className={cn(
        "flex items-center justify-between gap-4 w-[450px] h-[100px] px-4 py-3 bg-white rounded-xl shadow-sm",
        "border border-gray-200"
      )}
    >
      <div className="flex items-center gap-3">
        <Image
          className="rounded-md"
          width={94}
          height={56}
          alt="Payment Channel logo"
          src={paymentChannel}
        />
        <div className="flex flex-col justify-center">
          <figcaption className="font-source font-normal text-base text-black">
            {name}
          </figcaption>
          <p className="font-dm font-semibold text-lg text-black">{message}</p>
        </div>
      </div>
      <Image
        src={logo}
        alt="Chainfundit Logo"
        width={36}
        height={36}
        className="shrink-0"
      />
    </figure>
  );
};

export function NotificationsMarquee() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:20s]">
        <div className="flex gap-4">
          {[...firstRow, ...firstRow].map((notification, i) => (
            <NotificationCard key={`${notification.message}-${i}`} {...notification} />
          ))}
        </div>
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s]">
        <div className="flex gap-4">
          {[...secondRow, ...secondRow].map((notification, i) => (
            <NotificationCard key={`${notification.message}-${i}`} {...notification} />
          ))}
        </div>
      </Marquee>
      
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
    </div>
  );
}
