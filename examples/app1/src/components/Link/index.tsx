import { Link } from '@qude/router';
import { HTMLAttributes } from 'react';
import React from 'react';
import { PreloadLink } from '@route-preload/components';
interface LinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href: string;
}

const PrefetchLink = ({ href, ...props }: LinkProps) => {
  return (
    <PreloadLink flag={href} action="inview">
      <Link href={href} {...props} />
    </PreloadLink>
  );
};

export default PrefetchLink;
