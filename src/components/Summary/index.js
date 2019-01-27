import React from 'react';

import H1 from '../H1';
import P from '../P';
import Wrapper from './Wrapper';
import Link from './Link';
import Date from './Date';

function Summary({date, title, excerpt, slug}) {
  return (
    <Wrapper>
      <Link to={slug}>
        <H1>{title}</H1>
        <Date>{date}</Date>
        <P>{excerpt}</P>
      </Link>
    </Wrapper>
  );
}

export default Summary;
