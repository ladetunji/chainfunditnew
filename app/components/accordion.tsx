import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqsAccordion() {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full flex flex-col gap-3"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1 bg-white border border-black rounded-none">
        <AccordionTrigger className="font-semibold text-xl text-black">
          How to start a campaign?
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p className="font-normal text-base">
            Starting a campaign on Chainfundit is simple. Just create an
            account, set your fundraising goal, and share your campaign link.
            Our platform guides you through each step to ensure your success.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2 bg-white border border-black rounded-none">
        <AccordionTrigger className="font-semibold text-xl text-black">
          Can I edit my campaign?
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p className="font-normal text-base">
            Yes, you can edit your campaign at any time. Simply log in to your
            account, navigate to your campaign page, and make the necessary
            changes. This allows you to keep your supporters updated with the
            latest information.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3 bg-white border border-black rounded-none">
        <AccordionTrigger className="font-semibold text-xl text-black">
          What payment methods are accepted?
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p className="font-normal text-base">
            Chainfundit accepts various payment methods, including credit and
            debit cards, PayPal, Paystack, and other digital wallets. This
            flexibility ensures that your donors can contribute easily and
            securely. Check our website for a full list of accepted methods.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4 bg-white border border-black rounded-none">
        <AccordionTrigger className="font-semibold text-xl text-black">
          How are funds disbursed?
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p className="font-normal text-base">
            Funds raised through your campaign are typically disbursed within a
            few business days. Once your campaign ends, you can request a
            transfer to your bank account. We ensure a smooth and transparent
            process for all fund disbursements.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5 bg-white border border-black rounded-none">
        <AccordionTrigger className="font-semibold text-xl text-black">
          Is there a fee?
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <p className="font-normal text-base">
            Yes, Chainfundit charges a small fee on each donation to cover
            transaction costs. This fee is clearly outlined during the setup
            process. We strive to keep our fees low to maximize the funds you
            receive for your cause.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
