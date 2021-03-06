import escape from 'lodash/escape'

import { sliceIndexes, highlight, addLocalSearchMarks } from '@/utils/strings'

describe('strings', () => {
  describe('sliceIndexes', () => {
    it('should return empty list when input is empty string', () => {
      expect(sliceIndexes('', [])).toEqual([])
      expect(sliceIndexes('', [1, 3])).toEqual([])
    })

    it('should return the whole string when indexes are empty', () => {
      expect(sliceIndexes('a string', [])).toEqual(['a string'])
    })

    it('should return two parts when given [0]', () => {
      expect(sliceIndexes('a string', [0])).toEqual(['', 'a string'])
    })

    it('should return the whole string if indexes are outside the string', () => {
      expect(sliceIndexes('a string', [-1])).toEqual(['a string'])
      expect(sliceIndexes('a string', [9])).toEqual(['a string'])
      expect(sliceIndexes('a string', [-2, 10])).toEqual(['a string'])
    })

    it('should split the string in two when index is inside the string', () => {
      expect(sliceIndexes('a string', [1])).toEqual(['a', ' string'])
      expect(sliceIndexes('a string', [7])).toEqual(['a strin', 'g'])
    })

    it('should split the string in two when two indexes are equal', () => {
      expect(sliceIndexes('a string', [1, 1, 1])).toEqual(['a', ' string'])
      expect(sliceIndexes('a string', [7, 7])).toEqual(['a strin', 'g'])
    })

    it('should split the string in three when two indexes are inside the string', () => {
      expect(sliceIndexes('a string', [1, 2])).toEqual(['a', ' ', 'string'])
      expect(sliceIndexes('a string', [1, 7])).toEqual(['a', ' strin', 'g'])
    })

    it('should split the string in three with 0 in two indexes', () => {
      expect(sliceIndexes('a string', [0, 2])).toEqual(['', 'a ', 'string'])
    })

    it('should split the string in three when indexes are not ordered', () => {
      expect(sliceIndexes('a string', [2, 1])).toEqual(['a', ' ', 'string'])
      expect(sliceIndexes('a string', [7, 1])).toEqual(['a', ' strin', 'g'])
    })

    it('should split the string in 9 parts', () => {
      expect(sliceIndexes('a string that will be cut at each space', [1, 8, 13, 18, 21, 25, 28, 33]))
        .toEqual(['a', ' string', ' that', ' will', ' be', ' cut', ' at', ' each', ' space'])
    })
  })

  describe('highlight', () => {
    it('should return original string when mark list is empty', () => {
      expect(highlight('string', [])).toBe('string')
    })

    it('should return one mark at the beginning of the string', () => {
      expect(highlight('say hi to the world', [{ content: 'say', index: 0 }])).toBe('<mark>say</mark> hi to the world')
    })

    it('should return one mark', () => {
      expect(highlight('say hi to the world', [{ content: 'hi', index: 4 }])).toBe('say <mark>hi</mark> to the world')
    })

    it('should return several marks with same mention', () => {
      expect(highlight('Trump, Trump, Trump', [{ content: 'Trump', index: 0 }, { content: 'Trump', index: 7 }, { content: 'Trump', index: 14 }]))
        .toBe('<mark>Trump</mark>, <mark>Trump</mark>, <mark>Trump</mark>')
    })

    it('should return 3 marks', () => {
      expect(highlight('say hi to the world', [{ content: 'say', index: 0 }, { content: 'hi', index: 4 }, { content: 'world', index: 14 }]))
        .toBe('<mark>say</mark> <mark>hi</mark> to the <mark>world</mark>')
    })

    it('should return one mark with custom mark function', () => {
      expect(highlight('say hi to the world', [{ content: 'hi', category: 'cat', index: 4 }], m => `<b class="${m.category}">${m.content}</b>`))
        .toBe('say <b class="cat">hi</b> to the world')
    })

    it('should return one mark with custom rest function', () => {
      expect(highlight('say hi to </the> world', [{ content: 'hi', index: 4 }], m => m.content, r => escape(r)))
        .toBe('say hi to &lt;/the&gt; world')
    })

    it('should highlight namedEntities after having sorted them', () => {
      expect(highlight('say hi to the world', [{ content: 'world', index: 14 }, { content: 'hi', index: 4 }, { content: 'say', index: 0 }]))
        .toBe('<mark>say</mark> <mark>hi</mark> to the <mark>world</mark>')
    })
  })

  describe('addLocalSearchMarks', () => {
    it('should wrap "dolor" (lowercase) with tags in string without HTML', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'dolor' })
      expect(content).toBe('Lorem ipsum <mark class="local-search-term">dolor</mark>')
    })

    it('shouldn\'t wrap anything', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'sit amet' })
      expect(content).toBe('Lorem ipsum dolor')
    })

    it('should wrap "DOLOR" (uppercase) with tags in string without HTML', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum DOLOR', { label: 'dolor' })
      expect(content).toBe('Lorem ipsum <mark class="local-search-term">DOLOR</mark>')
    })

    it('should wrap "DOLOR" with tags in uppercase string without HTML', () => {
      const { content } = addLocalSearchMarks('LOREM IPSUM DOLOR', { label: 'dolor' })
      expect(content).toBe('LOREM IPSUM <mark class="local-search-term">DOLOR</mark>')
    })

    it('should wrap "dolor" with tags string without HTML even with a toekn in uppercase', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'DOLOR' })
      expect(content).toBe('Lorem ipsum <mark class="local-search-term">dolor</mark>')
    })

    it('should wrap "Lorem ipsum" with tags string without HTML even with a toekn in camelcase', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'Lorem Ipsum' })
      expect(content).toBe('<mark class="local-search-term">Lorem ipsum</mark> dolor')
    })

    it('should wrap "Lorem" with tags in string without HTML', () => {
      const { content } = addLocalSearchMarks('Lorem ipsum dolor', { label: 'Lorem' })
      expect(content).toBe('<mark class="local-search-term">Lorem</mark> ipsum dolor')
    })

    it('should wrap "dolor" with tags in string with HTML', () => {
      const { content } = addLocalSearchMarks('Lorem <strong>ipsum</strong> dolor', { label: 'dolor' })
      expect(content).toBe('Lorem <strong>ipsum</strong> <mark class="local-search-term">dolor</mark>')
    })

    it('should wrap "ipsum" with tags in string with HTML', () => {
      const { content } = addLocalSearchMarks('Lorem <strong>ipsum</strong> dolor', { label: 'ipsum' })
      expect(content).toBe('Lorem <strong><mark class="local-search-term">ipsum</mark></strong> dolor')
    })

    it('should wrap "ipsum" with tags in string with HTML, wrapped with a span', () => {
      const { content } = addLocalSearchMarks('<span>Lorem <strong>ipsum</strong> dolor</span>', { label: 'ipsum' })
      expect(content).toBe('<span>Lorem <strong><mark class="local-search-term">ipsum</mark></strong> dolor</span>')
    })

    it('should wrap "dolor" in a deeply nested string', () => {
      const { content } = addLocalSearchMarks('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>', { label: 'dolor' })
      expect(content).toBe('<i>Lorem</i> <strong>ipsum <span><mark class="local-search-term">dolor</mark></span></strong>')
    })

    it('should wrap "Lorem" in a deeply nested string', () => {
      const { content } = addLocalSearchMarks('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>', { label: 'lorem' })
      expect(content).toBe('<i><mark class="local-search-term">Lorem</mark></i> <strong>ipsum <span>dolor</span></strong>')
    })

    it('shouldn\'t wrap "Lorem ipsum" in different tags', () => {
      const { content } = addLocalSearchMarks('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>', { label: 'Lorem ipsum' })
      expect(content).toBe('<i>Lorem</i> <strong>ipsum <span>dolor</span></strong>')
    })

    it('should wrap regex', () => {
      const { content } = addLocalSearchMarks('France is not a tax heaven.\nBut most probably a taxidermists country.', { label: 'tax.*', regex: true })

      expect(content).toBe('France is not a <mark class="local-search-term">tax heaven.</mark>\nBut most probably a <mark class="local-search-term">taxidermists country.</mark>')
    })
  })
})
